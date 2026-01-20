import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getApiUrl } from '../config/api';

// Simple types (minimal)
interface DoctorProfile {
    isOnboarded: boolean;
    isVerified: boolean;
    email: string;
    professionalName?: string;
    specialty?: string;
    registrationNumber?: string;
}

interface DoctorContextType {
    user: User | null;
    profile: DoctorProfile | null;
    loading: boolean;
    token: string | null;
    login: (e: string, p: string) => Promise<any>;
    logout: () => Promise<void>;
    completeOnboarding: (data: any) => Promise<void>;
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
                            console.log(`[AUTH AUDIT] Token retrieved and cached. Length: ${idToken.length}`);
                            console.log(`[AUTH AUDIT] Token preview: ${idToken.slice(0, 30)}...`);
                            console.log(`[AUTH AUDIT] Syncing profile...`);
                            const res = await fetch(getApiUrl('/api/doctors/profile'), {
                                headers: { 'Authorization': `Bearer ${idToken}` }
                            });
                            if (res.ok) {
                                const data = await res.json();
                                console.log(`[AUTH AUDIT] Profile Synced. ID: ${data.id}, Verified: ${data.is_verified}`);
                                setProfile({
                                    professionalName: data.professionalName || data.professional_name,
                                    specialty: data.specialty,
                                    registrationNumber: data.registrationNumber || data.registration_number, // Map snake_case if needed
                                    isOnboarded: data.isOnboarded !== undefined ? data.isOnboarded : (data.is_onboarded || false),
                                    email: fbUser.email || "",
                                    isVerified: true
                                });
                            } else {
                                // Default profile if 404 (Verified but not onboarded)
                                console.warn(`[AUTH AUDIT] Profile Sync Failed (User likely new). Status: ${res.status}`);
                                setProfile({ isOnboarded: false, isVerified: true, email: fbUser.email || '' });
                            }
                        } catch (e) {
                            console.error("[AUTH AUDIT] Profile fetch error", e);
                            setProfile(null);
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
        console.log(`[AUTH AUDIT] Logout Initiated. CurrentUser: ${auth.currentUser?.uid}`);

        // 1. Sign out from Firebase
        await signOut(auth);
        console.log(`[AUTH AUDIT] Firebase signOut completed`);

        // 2. Clear local context state
        setUser(null);
        setProfile(null);
        setToken(null);
        console.log(`[AUTH AUDIT] Context state cleared (user, profile, token)`);

        // 3. Redirect to login
        window.location.href = '/';
    };

    const completeOnboarding = async (data: any) => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(getApiUrl('/api/doctors/profile'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Onboarding failed");

        // Optimistic update or refetch
        const updated = await res.json();
        setProfile(prev => ({
            ...prev!,
            ...updated,
            isOnboarded: true
        }));
    };

    return (
        <DoctorContext.Provider value={{ user, profile, loading, token, login, logout, completeOnboarding }}>
            {children}
        </DoctorContext.Provider>
    );
};

export const useDoctor = () => {
    const ctx = useContext(DoctorContext);
    if (!ctx) throw new Error("useDoctor must be used within DoctorProvider");
    return ctx;
};
