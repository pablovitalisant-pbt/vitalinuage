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
    isOnboarded: boolean;
    email: string;
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
    completeOnboarding: (data: DoctorProfile) => Promise<void>;
}

const defaultProfile: DoctorProfile = {
    professionalName: "Dr. Vitali",
    specialty: "",
    address: "",
    phone: "",
    isOnboarded: false,
    email: ""
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
                fetch(getApiUrl('/api/doctors/profile'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => ({ ok: false } as Response)),
                fetch(getApiUrl('/api/doctors/preferences'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => ({ ok: false } as Response))
            ]);

            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile({
                    professionalName: data.professional_name || "Dr. Vitali",
                    specialty: data.specialty || "",
                    address: "",
                    phone: "",
                    registrationNumber: data.registration_number || "",
                    isOnboarded: data.is_onboarded || false,
                    email: data.email || ""
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

    const completeOnboarding = async (data: DoctorProfile) => {
        if (!token) return;

        try {
            // Step 1: Update Profile Details
            const updateRes = await fetch(getApiUrl('/api/doctors/profile'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    professional_name: data.professionalName,
                    specialty: data.specialty,
                    medical_license: data.registrationNumber || "", // Map to medical_license for backend compatibility 
                    registration_number: data.registrationNumber || ""
                })
            });

            if (!updateRes.ok) throw new Error('Failed to update profile details');

            // Step 2: Finalize Onboarding (Trigger)
            const completeRes = await fetch(getApiUrl('/api/doctors/onboarding/complete'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!completeRes.ok) throw new Error('Failed to finalize onboarding');

            const updated = await completeRes.json();

            // Step 3: Sync Local State
            setProfile(prev => ({
                ...prev,
                professionalName: updated.professional_name,
                specialty: updated.specialty,
                registrationNumber: updated.registration_number,
                isOnboarded: true,
                email: updated.email || prev.email
            }));

        } catch (error) {
            console.error('Onboarding Error:', error);
            throw error;
        }
    };

    const updatePreferences = async (newPrefs: Partial<PrintPreferences>) => {
        setPreferences(prev => ({ ...prev, ...newPrefs }));
        if (!token) return;

        try {
            await fetch(getApiUrl('/api/doctors/preferences'), {
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
            setToken,
            completeOnboarding
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
