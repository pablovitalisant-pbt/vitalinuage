import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import featureFlags from '../../../config/feature-flags.json';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export interface DoctorProfile {
    professionalName: string;
    specialty: string;
    address: string;
    phone: string;
    registrationNumber?: string;
    isOnboarded: boolean;
    email: string;
    isVerified: boolean;
}

const defaultProfile: DoctorProfile = {
    professionalName: "Dr. Vitali",
    specialty: "",
    address: "",
    phone: "",
    isOnboarded: false,
    email: "",
    isVerified: false
};

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

const defaultPreferences: PrintPreferences = {
    paperSize: 'A4',
    templateId: 'classic'
};

interface DoctorContextType {
    user: User | null;
    profile: DoctorProfile | null;
    loading: boolean;
    preferences: PrintPreferences;
    login: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<void>;
    updateProfile: (newData: Partial<DoctorProfile>) => void;
    updatePreferences: (newPrefs: Partial<PrintPreferences>) => Promise<void>;
    completeOnboarding: (data: DoctorProfile) => Promise<void>;
    token: string | null; // Compatibility
}

export const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export function DoctorProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [preferences, setPreferences] = useState<PrintPreferences>(defaultPreferences);
    const [loading, setLoading] = useState<boolean>(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setLoading(true);
            if (fbUser) {
                try {
                    console.log("[AUTH] User detected. Syncing...");
                    await fbUser.reload();
                    const freshToken = await fbUser.getIdToken(true);
                    setToken(freshToken);
                    localStorage.setItem('token', freshToken);
                    setUser(fbUser);

                    if (fbUser.emailVerified) {
                        try {
                            const [profileRes, prefsRes] = await Promise.all([
                                fetch(getApiUrl('/api/doctors/profile'), { headers: { 'Authorization': `Bearer ${freshToken}` } }),
                                fetch(getApiUrl('/api/doctors/preferences'), { headers: { 'Authorization': `Bearer ${freshToken}` } })
                            ]);

                            if (profileRes.ok) {
                                const data = await profileRes.json();
                                setProfile({
                                    professionalName: data.professionalName || data.professional_name || "Dr. Vitali",
                                    specialty: data.specialty || "",
                                    address: "",
                                    phone: "",
                                    registrationNumber: data.registrationNumber || data.registration_number || "",
                                    isOnboarded: data.isOnboarded !== undefined ? data.isOnboarded : (data.is_onboarded || false),
                                    email: fbUser.email || "",
                                    isVerified: fbUser.emailVerified
                                });
                            } else {
                                // Fallback for verified user but no profile (first time)
                                setProfile({ ...defaultProfile, email: fbUser.email || "", isVerified: true });
                            }

                            if (prefsRes.ok) {
                                const prefsCtx = await prefsRes.json();
                                setPreferences({
                                    paperSize: prefsCtx.paper_size || 'A4',
                                    templateId: prefsCtx.template_id || 'classic',
                                    logoUrl: prefsCtx.logo_url,
                                    signatureUrl: prefsCtx.signature_url
                                });
                            }
                        } catch (err) {
                            console.error("Error loading backend profile:", err);
                        }
                    } else {
                        // Unverified
                        setProfile({ ...defaultProfile, email: fbUser.email || "", isVerified: false });
                    }
                } catch (e) {
                    console.error("Error reloading user:", e);
                }
            } else {
                setUser(null);
                setToken(null);
                setProfile(null);
                localStorage.removeItem('token');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setProfile(null);
        setToken(null);
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    const updateProfile = (newData: Partial<DoctorProfile>) => {
        if (profile) setProfile({ ...profile, ...newData });
    };

    const updatePreferences = async (newPrefs: Partial<PrintPreferences>) => {
        setPreferences(prev => ({ ...prev, ...newPrefs }));
        if (!token) return;
        try {
            await fetch(getApiUrl('/api/doctors/preferences'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    paper_size: newPrefs.paperSize,
                    template_id: newPrefs.templateId,
                    header_text: newPrefs.headerText,
                    footer_text: newPrefs.footerText,
                    primary_color: newPrefs.primaryColor,
                    secondary_color: newPrefs.secondaryColor
                })
            });
        } catch (e) { console.error(e); }
    };

    const completeOnboarding = async (data: DoctorProfile) => {
        if (!token) return;
        const res = await fetch(getApiUrl('/api/doctors/profile'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                professionalName: data.professionalName,
                specialty: data.specialty,
                medicalLicense: data.registrationNumber || "",
                registrationNumber: data.registrationNumber || ""
            })
        });
        if (!res.ok) throw new Error("Failed onboarding");
        const updated = await res.json();
        setProfile(prev => prev ? ({
            ...prev,
            professionalName: updated.professionalName || updated.professional_name,
            specialty: updated.specialty,
            registrationNumber: updated.registrationNumber || updated.registration_number,
            isOnboarded: true
        }) : null);
    };

    return (
        <DoctorContext.Provider value={{
            user, profile, loading, preferences, token,
            login, logout, updateProfile, updatePreferences, completeOnboarding
        }}>
            {children}
        </DoctorContext.Provider>
    );
}

export function useDoctor() {
    const context = useContext(DoctorContext);
    if (!context) throw new Error('useDoctor must be used within DoctorProvider');
    return context;
}
