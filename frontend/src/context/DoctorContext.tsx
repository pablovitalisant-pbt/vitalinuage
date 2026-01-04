import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DoctorProfile {
    professionalName: string;
    specialty: string;
    address: string;
    phone: string;
}

interface PrintPreferences {
    paperSize: 'A4' | 'A5';
    templateId: 'minimal' | 'modern' | 'classic';
    headerText?: string;
    footerText?: string;
    logoUrl?: string; // URL to the uploaded logo
    primaryColor?: string;
    secondaryColor?: string;
}

interface DoctorContextType {
    profile: DoctorProfile;
    preferences: PrintPreferences;
    updateProfile: (newProfile: Partial<DoctorProfile>) => void;
    updatePreferences: (newPrefs: Partial<PrintPreferences>) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const defaultProfile: DoctorProfile = {
    professionalName: "Dr. Vitali",
    specialty: "Medicina General",
    address: "",
    phone: ""
};

const defaultPreferences: PrintPreferences = {
    paperSize: 'A4',
    templateId: 'classic'
};

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export function DoctorProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<DoctorProfile>(defaultProfile);
    const [preferences, setPreferences] = useState<PrintPreferences>(defaultPreferences);

    const refreshProfile = async () => {
        try {
            // Parallel fetch for profile and preferences
            const [profileRes, prefsRes] = await Promise.all([
                fetch('/api/doctor/profile'),
                fetch('/api/doctor/preferences')
            ]);

            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile({
                    professionalName: data.professional_name || "Dr. Vitali",
                    specialty: data.specialty || "",
                    address: data.address || "",
                    phone: data.phone || ""
                });
            }

            if (prefsRes.ok) {
                const data = await prefsRes.json();
                setPreferences({
                    paperSize: data.paper_size || 'A4',
                    templateId: data.template_id || 'classic',
                    headerText: data.header_text,
                    footerText: data.footer_text,
                    logoUrl: data.logo_url,
                    primaryColor: data.primary_color || "#1e3a8a",
                    secondaryColor: data.secondary_color || "#64748b"
                });
            }

        } catch (error) {
            console.error("Failed to fetch doctor data", error);
        }
    };

    // Load on mount
    useEffect(() => {
        refreshProfile();
    }, []);

    const updateProfile = (newData: Partial<DoctorProfile>) => {
        setProfile(prev => ({ ...prev, ...newData }));
    };

    const updatePreferences = async (newPrefs: Partial<PrintPreferences>) => {
        // Optimistic update
        setPreferences(prev => ({ ...prev, ...newPrefs }));

        // Send backend update
        try {
            const payload = {
                paper_size: newPrefs.paperSize,
                template_id: newPrefs.templateId,
                header_text: newPrefs.headerText,
                footer_text: newPrefs.footerText,
                primary_color: newPrefs.primaryColor,
                secondary_color: newPrefs.secondaryColor
            };

            await fetch('/api/doctor/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            // We could re-fetch to confirm, but optimistic is fine for now
        } catch (err) {
            console.error("Failed to save preferences", err);
        }
    };

    return (
        <DoctorContext.Provider value={{ profile, preferences, updateProfile, updatePreferences, refreshProfile }}>
            {children}
        </DoctorContext.Provider>
    );
}

export function useDoctor() {
    const context = useContext(DoctorContext);
    if (!context) {
        throw new Error('useDoctor must be used within a DoctorProvider');
    }
    return context;
}
