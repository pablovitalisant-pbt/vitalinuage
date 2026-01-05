import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import { DoctorProfile as DoctorProfileDTO } from '../contracts/dashboard';
import featureFlags from '../../../config/feature-flags.json';

export interface DoctorProfile {
    professionalName: string;
    specialty: string;
    address: string;
    phone: string;
    registrationNumber?: string;
}

export interface PrintPreferences {
    paperSize: 'A4' | 'Letter';
    templateId: 'classic' | 'modern' | 'minimal';
    logoUrl?: string | null;
    signatureUrl?: string | null;
    headerText?: string;
    footerText?: string;
    primaryColor?: string;
    secondaryColor?: string;
}

interface DoctorContextType {
    profile: DoctorProfile;
    preferences: PrintPreferences;
    updateProfile: (newData: Partial<DoctorProfile>) => void;
    updatePreferences: (newPrefs: Partial<PrintPreferences>) => Promise<void>;
    refreshProfile: () => Promise<void>;
    token: string | null;
    setToken: (token: string | null) => void;
}

const defaultProfile: DoctorProfile = {
    professionalName: "Dr. Vitali",
    specialty: "",
    address: "",
    phone: ""
};

const defaultPreferences: PrintPreferences = {
    paperSize: 'A4',
    templateId: 'classic'
};

export const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export function DoctorProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<DoctorProfile>(defaultProfile);
    const [preferences, setPreferences] = useState<PrintPreferences>(defaultPreferences);

    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    const refreshProfile = async () => {
        // Feature Flag Check
        if (!featureFlags.identity_search_v1) {
            setProfile(defaultProfile);
            return;
        }

        if (!token) return;

        try {
            const [profileRes, prefsRes] = await Promise.all([
                fetch(getApiUrl('/api/doctor/profile'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => ({ ok: false } as Response)),
                fetch(getApiUrl('/api/doctor/preferences'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => ({ ok: false } as Response))
            ]);

            if (profileRes.ok) {
                const data = (await profileRes.json()) as DoctorProfileDTO;
                setProfile({
                    professionalName: data.professional_name || "Dr. Vitali",
                    specialty: data.specialty || "",
                    address: "",
                    phone: "",
                    registrationNumber: data.registration_number || ""
                });
            } else if (profileRes.status !== 401) {
                setProfile(defaultProfile);
            }

            if (prefsRes.ok) {
                const data = await prefsRes.json();
                setPreferences({
                    paperSize: data.paper_size || 'A4',
                    templateId: data.template_id || 'classic',
                    logoUrl: data.logo_url || null,
                    signatureUrl: data.signature_url || null
                });
            }
        } catch (error) {
            console.error('Error refreshing profile:', error);
            setProfile(defaultProfile);
        }
    };

    // Auto-refresh on mount/token change
    useEffect(() => {
        refreshProfile();
    }, [token]);

    const updateProfile = (newData: Partial<DoctorProfile>) => {
        setProfile(prev => ({ ...prev, ...newData }));
    };

    const updatePreferences = async (newPrefs: Partial<PrintPreferences>) => {
        setPreferences(prev => ({ ...prev, ...newPrefs }));
        if (!token) return;

        try {
            await fetch(getApiUrl('/api/doctor/preferences'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    paper_size: newPrefs.paperSize,
                    template_id: newPrefs.templateId,
                    header_text: newPrefs.headerText,
                    footer_text: newPrefs.footerText,
                    primary_color: newPrefs.primaryColor,
                    secondary_color: newPrefs.secondaryColor
                })
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <DoctorContext.Provider value={{
            profile,
            preferences,
            updateProfile,
            updatePreferences,
            refreshProfile,
            token,
            setToken
        }}>
            {children}
        </DoctorContext.Provider>
    );
}

export function useDoctor() {
    const context = useContext(DoctorContext);
    if (!context) {
        throw new Error('useDoctor must be used within DoctorProvider');
    }
    return context;
}
