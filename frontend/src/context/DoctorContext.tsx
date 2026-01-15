import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { getApiUrl } from '../config/api';
// Remove unused import if not needed, or keep if used elsewhere
// import { DoctorProfile as DoctorProfileDTO } from '../contracts/dashboard'; 
import featureFlags from '../../../config/feature-flags.json';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface DoctorProfile {
    professionalName: string;
    specialty: string;
    address: string;
    phone: string;
    registrationNumber?: string;
    isOnboarded: boolean;
    email: string;
    isVerified: boolean; // Slice 40
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

interface DoctorContextType {
    profile: DoctorProfile;
    preferences: PrintPreferences;
    updateProfile: (newData: Partial<DoctorProfile>) => void;
    updatePreferences: (newPrefs: Partial<PrintPreferences>) => Promise<void>;
    refreshProfile: () => Promise<void>;
    triggerAuthRefresh: () => Promise<void>; // Slice 40.6: Manual re-lock trigger
    token: string | null;
    setToken: (token: string | null) => void;
    completeOnboarding: (data: DoctorProfile) => Promise<void>;
    isLoading: boolean;
    isVerifyingFirebase: boolean; // Slice 40.2: Atomic sync lock
    authStatusMessage: string | null; // Slice 23: Feedback State
}



const defaultPreferences: PrintPreferences = {
    paperSize: 'A4',
    templateId: 'classic'
};

export const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export function DoctorProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<DoctorProfile>(defaultProfile);
    const [preferences, setPreferences] = useState<PrintPreferences>(defaultPreferences);

    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    // Slice SP-04: Loading Guard State
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // Slice 40.2: Firebase Verification Sync Lock (CRITICAL)
    const [isVerifyingFirebase, setIsVerifyingFirebase] = useState<boolean>(true);
    // Slice 23: Latency Feedback
    const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null);

    const refreshProfile = async () => {
        // Feature Flag Check
        if (!featureFlags.identity_search_v1) {
            setProfile(defaultProfile);
            setIsLoading(false);
            setIsVerifyingFirebase(false);
            return;
        }

        if (!token) {
            setIsLoading(false);
            setIsVerifyingFirebase(false);
            return;
        }

        const startTime = Date.now();
        // Slice 23: AbortController for 12s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s Security Timeout

        // Slice 23: Feedback timer for 7s
        const feedbackTimer = setTimeout(() => {
            setAuthStatusMessage("Despertando servidor...");
        }, 7000);

        try {
            // Ensure loading is true (useful for retries)
            setIsLoading(true);
            setIsVerifyingFirebase(true); // ATOMIC LOCK: Block routing decisions
            setAuthStatusMessage(null);

            // CRITICAL FIX: Force reload Firebase user to get fresh emailVerified status
            // This prevents false positives where verified users are blocked
            let freshEmailVerified = false;
            if (auth.currentUser) {
                try {
                    await auth.currentUser.reload();
                    freshEmailVerified = auth.currentUser.emailVerified;

                    // CRITICAL: Force ID token refresh so backend receives updated verification claim
                    if (freshEmailVerified) {
                        await auth.currentUser.getIdToken(true);
                    }
                } catch (reloadError) {
                    console.warn('Firebase user reload failed:', reloadError);
                    // Continue with cached value if reload fails
                    freshEmailVerified = auth.currentUser.emailVerified;
                }
            }

            const [profileRes, prefsRes] = await Promise.all([
                fetch(getApiUrl('/api/doctors/profile'), {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal
                }).catch((err) => {
                    // Start manually handling fetch errors vs HTTP errors
                    if (err.name === 'AbortError') {
                        throw new Error('Request timed out (12s)');
                    }
                    return { ok: false, status: 500 } as Response;
                }),
                fetch(getApiUrl('/api/doctors/preferences'), {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal
                }).catch((err) => {
                    if (err.name === 'AbortError') throw err;
                    return { ok: false, status: 500 } as Response;
                })
            ]);

            if (profileRes.ok) {
                const data = await profileRes.json();

                // Slice 20: State-Aware. Always use the returned profile.
                // Use FRESH Firebase emailVerified status (source of truth)
                setProfile({
                    professionalName: data.professionalName || data.professional_name || "Dr. Vitali",
                    specialty: data.specialty || "",
                    address: "",
                    phone: "",
                    registrationNumber: data.registrationNumber || data.registration_number || "",
                    isOnboarded: data.isOnboarded !== undefined ? data.isOnboarded : (data.is_onboarded || false),
                    email: data.email || "",
                    isVerified: freshEmailVerified // Use Firebase as source of truth, not backend
                });
            } else if (profileRes.status !== 401) {
                // If 401, we might want to logout, but for now just clear profile
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

            const endTime = Date.now();
            console.log(`DEBUG [Auth]: Perfil cargado en ${endTime - startTime}ms`);

        } catch (error) {
            console.error('DEBUG FETCH CRASH:', error);
            setProfile(defaultProfile);
        } finally {
            // Slice SP-04: Ensure loading stops
            setIsLoading(false);
            setIsVerifyingFirebase(false); // ATOMIC UNLOCK: Allow routing decisions
            setAuthStatusMessage(null);
            clearTimeout(timeoutId);
            clearTimeout(feedbackTimer);
        }
    };

    // NUCLEAR FIX: Firebase Auth State Listener with Pre-emptive Locking
    // System starts LOCKED and only unlocks after Firebase verification completes
    useEffect(() => {
        console.log('[AUDIT] Initializing Firebase auth state listener...');

        // Ensure lock is set on mount
        setIsVerifyingFirebase(true);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('[AUDIT] Auth state change detected. User:', user?.email || 'null');

            // RE-LOCK on every auth state change
            setIsVerifyingFirebase(true);
            setIsLoading(true);

            if (user) {
                try {
                    console.log('[AUDIT] User present. Starting atomic reload...');

                    // CRITICAL: Force reload to get fresh emailVerified from Firebase servers
                    await user.reload();
                    const freshEmailVerified = user.emailVerified;

                    console.log(`[AUDIT] Reload successful. emailVerified: ${freshEmailVerified}`);

                    // Force token refresh if verified
                    if (freshEmailVerified) {
                        await user.getIdToken(true);
                        console.log('[AUDIT] Token refreshed for verified user');
                    }

                    // Update profile with fresh verification status
                    setProfile(prev => ({
                        ...prev,
                        email: user.email || prev.email,
                        isVerified: freshEmailVerified
                    }));

                    console.log('[AUDIT] Profile updated with fresh verification status');

                    // CRITICAL: Fetch backend profile while still locked
                    if (token) {
                        console.log('[AUDIT] Fetching backend profile...');
                        await refreshProfile();
                    }

                } catch (error) {
                    console.error('[AUDIT] Error in auth state reload:', error);
                } finally {
                    // UNLOCK: System is now ready for routing decisions
                    setIsVerifyingFirebase(false);
                    setIsLoading(false);
                    console.log('[AUDIT] SYSTEM RELEASED: Navigation permitted.');
                }
            } else {
                console.log('[AUDIT] No user. Clearing profile.');
                setProfile(defaultProfile);
                setIsVerifyingFirebase(false);
                setIsLoading(false);
            }
        });

        return () => {
            console.log('[AUDIT] Cleaning up auth listener');
            unsubscribe();
        };
    }, [token]); // Re-run when token changes to trigger backend profile fetch if user is present

    // Slice 40.6: Manual auth refresh trigger for login
    // This is called by Login component after successful token save
    const triggerAuthRefresh = async () => {
        console.log('[AUDIT] Manual auth refresh triggered (post-login)');

        // RE-LOCK the system
        setIsVerifyingFirebase(true);
        setIsLoading(true);

        try {
            // Check if Firebase user exists and reload
            if (auth.currentUser) {
                console.log('[AUDIT] Firebase user detected. Reloading...');
                await auth.currentUser.reload();
                const freshEmailVerified = auth.currentUser.emailVerified;

                console.log(`[AUDIT] Reload successful. emailVerified: ${freshEmailVerified}`);

                // Update profile with fresh verification status
                setProfile(prev => ({
                    ...prev,
                    email: auth.currentUser?.email || prev.email,
                    isVerified: freshEmailVerified
                }));

                if (freshEmailVerified) {
                    await auth.currentUser.getIdToken(true);
                }
            }

            // Fetch backend profile
            if (token) {
                await refreshProfile();
            }

        } catch (error) {
            console.error('[AUDIT] Error in manual auth refresh:', error);
        } finally {
            // UNLOCK
            setIsVerifyingFirebase(false);
            setIsLoading(false);
            console.log('[AUDIT] SYSTEM RELEASED after manual refresh');
        }
    };

    const updateProfile = (newData: Partial<DoctorProfile>) => {
        setProfile(prev => ({ ...prev, ...newData }));
    };

    const completeOnboarding = async (data: DoctorProfile) => {
        if (!token) return;

        try {
            // Slice 12: Consolidated Onboarding to single POST
            const response = await fetch(getApiUrl('/api/doctors/profile'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    professionalName: data.professionalName,
                    specialty: data.specialty,
                    medicalLicense: data.registrationNumber || "",
                    registrationNumber: data.registrationNumber || ""
                })
            });

            if (!response.ok) throw new Error('Failed to complete onboarding');

            const updated = await response.json();

            // Sync Local State
            setProfile(prev => ({
                ...prev,
                professionalName: updated.professionalName || updated.professional_name,
                specialty: updated.specialty,
                registrationNumber: updated.registrationNumber || updated.registration_number,
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
            triggerAuthRefresh,
            token,
            setToken,
            completeOnboarding,
            isLoading,
            isVerifyingFirebase,
            authStatusMessage
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
