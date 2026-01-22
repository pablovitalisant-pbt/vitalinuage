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
    preferences: any;
    updatePreferences: (prefs: any) => void;
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

    // Stub for preferences (to satisfy interface usage in other components)
    // In a real implementation this would fetch from backend
    const [preferences, setPreferences] = useState<any>({});
    const updatePreferences = (newPrefs: any) => setPreferences((prev: any) => ({ ...prev, ...newPrefs }));

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
