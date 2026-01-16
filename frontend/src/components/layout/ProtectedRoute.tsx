import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext';
import { auth } from '../../config/firebase';


interface ProtectedRouteProps {
    children: ReactNode;
}

import featureFlags from '../../../../config/feature-flags.json';

/**
 * PROTECTED ROUTE - SLICE 40.7 (FINAL IRON SEAL)
 * Implements "Absolute State Barrier" pattern to eliminate race conditions
 * during login and React StrictMode re-mounts.
 * 
 * CRITICAL: State barrier is checked FIRST, before any authentication logic.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { token, profile, isLoading, isVerifyingFirebase, isTransitioning } = useDoctor();
    const location = useLocation();

    // Real-time state audit
    useEffect(() => {
        console.log('[ROUTER_AUDIT] Evaluating access:', {
            path: location.pathname,
            isVerifyingFirebase,
            isLoading,
            isTransitioning,
            hasToken: !!token,
            isVerified: profile?.isVerified,
            isOnboarded: profile?.isOnboarded
        });
    }, [location.pathname, isVerifyingFirebase, isLoading, isTransitioning, token, profile]);

    // 1. ABSOLUTE STATE BARRIER (MAXIMUM PRIORITY)
    // Do NOT make ANY navigation decisions while system is in transition.
    // This prevents premature redirects when token is momentarily null during re-mounts.
    if (isVerifyingFirebase || isTransitioning || (token && isLoading)) {
        console.log('[ROUTER_AUDIT] ACTIVE LOCK: Rendering spinner...');
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <p className="text-sm font-medium text-gray-500 animate-pulse">
                        Sincronizando sesión segura...
                    </p>
                </div>
            </div>
        );
    }

    // 2. AUTHENTICATION CHECK (ONLY WHEN STATE IS STABLE)
    if (!token) {
        console.log('[ROUTER_AUDIT] Session not found. Redirecting to /');
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 3. EMAIL VERIFICATION CHECK (SOURCE: FIREBASE TRUTH CHECK)
    // bypasses stale React state by asking Firebase directly
    if (!auth.currentUser?.emailVerified) {
        console.log('[ROUTER_AUDIT] Email not verified (Google Truth). Blocking access.');
        return <Navigate to="/verify-email" replace />;
    }

    // Prevent verified users from accessing verification page
    if (auth.currentUser?.emailVerified && location.pathname === '/verify-email') {
        console.log('[ROUTER_AUDIT] User verified but on /verify-email. Redirecting to /dashboard');
        return <Navigate to="/dashboard" replace />;
    }

    // 4. ONBOARDING CHECK (SOURCE: BACKEND)
    const showOnboarding = featureFlags?.onboarding_workflow ?? false;

    if (showOnboarding && auth.currentUser?.emailVerified) {
        // Redirect to onboarding if not completed
        if (!profile?.isOnboarded && location.pathname !== '/setup-profile') {
            console.log('[ROUTER_AUDIT] FLOW: Incomplete profile. Redirecting to onboarding.');
            return <Navigate to="/setup-profile" replace />;
        }

        // Prevent onboarded users from accessing onboarding page
        if (profile?.isOnboarded && location.pathname === '/setup-profile') {
            console.log('[ROUTER_AUDIT] User onboarded but on /setup-profile. Redirecting to /dashboard');
            return <Navigate to="/dashboard" replace />;
        }
    }

    // 5. ACCESS GRANTED
    console.log('[ROUTER_AUDIT] Access granted to:', location.pathname);
    return <>{children}</>;
}
