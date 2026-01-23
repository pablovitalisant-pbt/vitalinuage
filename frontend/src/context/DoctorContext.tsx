import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getApiUrl } from '../config/api';
import { createAuthFetch } from '../lib/authFetch';
import { fetchDoctorProfile } from '../services/doctorProfile.service';

// Simple types (minimal)
interface DoctorProfile {
    isOnboarded: boolean;
    isVerified: boolean;
    email: string;
    professionalName?: string;
    specialty?: string;
    registrationNumber?: string;
    profileImage?: string;
    signatureImage?: string;
}

interface DoctorContextType {
    user: User | null;
    profile: DoctorProfile | null;
    loading: boolean;
    token: string | null;
    login: (e: string, p: string) => Promise<any>;
    logout: () => Promise<void>;
    completeOnboarding: (data: any) => Promise<void>;
    refreshProfile: () => Promise<void>;
    preferences: PrintPreferences;
    updatePreferences: (prefs: Partial<PrintPreferences>) => Promise<void>;
}

interface PrintPreferences {
    paperSize: string;
    templateId: string;
    headerText: string;
    footerText: string;
    primaryColor: string;
    secondaryColor: string;
    logoPath?: string | null;
}

export const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export const DoctorProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            console.log(`[AUTH AUDIT] Auth State Changed. User: ${fbUser ? fbUser.uid : 'null'}`);
            setLoading(true);

            if (fbUser) {
                try {
                    await fbUser.reload();
                    setUser(fbUser);
                    console.log(`[AUTH AUDIT] User Reloaded. EmailVerified: ${fbUser.emailVerified}`);

                    if (fbUser.emailVerified) {
                        try {
                            const idToken = await fbUser.getIdToken();
                            setToken(idToken);
                            console.log(`[AUTH AUDIT] Token retrieved. Length: ${idToken.length}`);

                            // Create secure fetcher with FRESH token getter
                            const authFetch = createAuthFetch(
                                async () => fbUser.getIdToken(),
                                async () => { await signOut(auth); }
                            );

                            console.log(`[AUTH AUDIT] DoctorContext profile sync start`);
                            const profileData = await fetchDoctorProfile(authFetch);
                            console.log(`[AUTH AUDIT] DoctorContext profile sync ok (ID: ${profileData.email})`);

                            setProfile({
                                professionalName: profileData.professionalName || profileData.professional_name,
                                specialty: profileData.specialty,
                                registrationNumber: profileData.registrationNumber || profileData.registration_number,
                                profileImage: profileData.profileImage || profileData.profile_image,
                                signatureImage: profileData.signatureImage || profileData.signature_image,
                                isOnboarded: profileData.isOnboarded !== undefined ? profileData.isOnboarded : (profileData.is_onboarded || false),
                                email: fbUser.email || "",
                                isVerified: true
                            });

                            try {
                                const prefRes = await authFetch(getApiUrl('/api/doctors/preferences'));
                                if (prefRes.ok) {
                                    const prefData = await prefRes.json();
                                    setPreferences(mapPreferencesFromApi(prefData));
                                }
                            } catch (prefError) {
                                console.warn('Failed to load preferences', prefError);
                            }

                        } catch (e: any) {
                            console.warn(`[AUTH AUDIT] DoctorContext profile sync failed: ${e.message}`);
                            // Fallback: use actual email verification status from Firebase
                            setProfile({
                                isOnboarded: false,
                                isVerified: fbUser.emailVerified,
                                email: fbUser.email || ''
                            });
                        }
                    } else {
                        console.log(`[AUTH AUDIT] Email NOT verified.`);
                        setProfile({ isOnboarded: false, isVerified: false, email: fbUser.email || '' });
                    }
                } catch (e) {
                    console.error("[AUTH AUDIT] Auth reload error", e);
                    setUser(null);
                    setProfile(null);
                }
            } else {
                console.log(`[AUTH AUDIT] No User. Clearing State.`);
                setUser(null);
                setProfile(null);
                setToken(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = (e: string, p: string) => signInWithEmailAndPassword(auth, e, p);

    const logout = async () => {
        console.log(`[AUTH AUDIT] Logout Initiated.`);
        await signOut(auth);
        console.log(`[AUTH AUDIT] Firebase signOut completed`);
    };

    const completeOnboarding = async (data: any) => {
        if (!auth.currentUser) return;
        const idToken = await auth.currentUser.getIdToken();
        const authFetch = createAuthFetch(
            async () => idToken,
            async () => { await signOut(auth); }
        );

        const res = await authFetch(getApiUrl('/api/doctors/profile'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error("Onboarding failed");

        const updated = await res.json();
        setProfile(prev => ({
            ...prev!,
            ...updated,
            isOnboarded: true
        }));
    };

    const refreshProfile = async () => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken(true);
            const authFetch = createAuthFetch(
                async () => idToken,
                async () => { await signOut(auth); }
            );

            const profileData = await fetchDoctorProfile(authFetch);
            setProfile({
                professionalName: profileData.professionalName || profileData.professional_name,
                specialty: profileData.specialty,
                registrationNumber: profileData.registrationNumber || profileData.registration_number,
                profileImage: profileData.profileImage || profileData.profile_image,
                signatureImage: profileData.signatureImage || profileData.signature_image,
                isOnboarded: profileData.isOnboarded !== undefined ? profileData.isOnboarded : (profileData.is_onboarded || false),
                email: user.email || "",
                isVerified: true
            });
        } catch (e) {
            console.error("Failed to refresh profile", e);
        }
    };

    const [preferences, setPreferences] = useState<PrintPreferences>({
        paperSize: 'A4',
        templateId: 'classic',
        headerText: '',
        footerText: '',
        primaryColor: '#1e3a8a',
        secondaryColor: '#64748b',
        logoPath: null
    });

    const mapPreferencesFromApi = (data: any): PrintPreferences => ({
        paperSize: data.paper_size || 'A4',
        templateId: data.template_id || 'classic',
        headerText: data.header_text || '',
        footerText: data.footer_text || '',
        primaryColor: data.primary_color || '#1e3a8a',
        secondaryColor: data.secondary_color || '#64748b',
        logoPath: data.logo_path || null
    });

    const updatePreferences = async (newPrefs: Partial<PrintPreferences>) => {
        setPreferences((prev) => ({ ...prev, ...newPrefs }));

        if (!auth.currentUser) return;
        try {
            const authFetch = createAuthFetch(
                async () => auth.currentUser!.getIdToken(),
                async () => { await signOut(auth); }
            );

            const payload: Record<string, string | null> = {};
            if (newPrefs.paperSize !== undefined) payload.paper_size = newPrefs.paperSize;
            if (newPrefs.templateId !== undefined) payload.template_id = newPrefs.templateId;
            if (newPrefs.headerText !== undefined) payload.header_text = newPrefs.headerText;
            if (newPrefs.footerText !== undefined) payload.footer_text = newPrefs.footerText;
            if (newPrefs.primaryColor !== undefined) payload.primary_color = newPrefs.primaryColor;
            if (newPrefs.secondaryColor !== undefined) payload.secondary_color = newPrefs.secondaryColor;
            if (newPrefs.logoPath !== undefined) payload.logo_path = newPrefs.logoPath;

            const res = await authFetch(getApiUrl('/api/doctors/preferences'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setPreferences(mapPreferencesFromApi(data));
            }
        } catch (error) {
            console.error('Failed to update preferences', error);
        }
    };

    return (
        <DoctorContext.Provider value={{ user, profile, loading, token, login, logout, completeOnboarding, refreshProfile, preferences, updatePreferences } as any}>
            {children}
        </DoctorContext.Provider>
    );
};

export const useDoctor = () => {
    const ctx = useContext(DoctorContext);
    if (!ctx) throw new Error("useDoctor must be used within DoctorProvider");
    return ctx;
};
