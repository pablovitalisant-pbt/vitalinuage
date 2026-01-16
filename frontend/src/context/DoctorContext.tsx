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
    login: (e: string, p: string) => Promise<any>;
    logout: () => Promise<void>;
    completeOnboarding: (data: any) => Promise<void>;
}

export const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export const DoctorProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setLoading(true);
            if (fbUser) {
                try {
                    await fbUser.reload();
                    setUser(fbUser);

                    if (fbUser.emailVerified) {
                        try {
                            const token = await fbUser.getIdToken();
                            const res = await fetch(getApiUrl('/api/doctors/profile'), {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                                const data = await res.json();
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
                                setProfile({ isOnboarded: false, isVerified: true, email: fbUser.email || '' });
                            }
                        } catch (e) {
                            console.error("Profile fetch error", e);
                            setProfile(null);
                        }
                    } else {
                        setProfile({ isOnboarded: false, isVerified: false, email: fbUser.email || '' });
                    }
                } catch (e) {
                    console.error("Auth reload error", e);
                    setUser(null);
                    setProfile(null);
                }
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = (e: string, p: string) => signInWithEmailAndPassword(auth, e, p);

    const logout = async () => {
        await signOut(auth);
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
        <DoctorContext.Provider value={{ user, profile, loading, login, logout, completeOnboarding }}>
            {children}
        </DoctorContext.Provider>
    );
};

export const useDoctor = () => {
    const ctx = useContext(DoctorContext);
    if (!ctx) throw new Error("useDoctor must be used within DoctorProvider");
    return ctx;
};
