import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

import featureFlags from '../../../../config/feature-flags.json';

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { token, profile, isLoading, isVerifyingFirebase } = useDoctor();
    const location = useLocation();

    // Debug logging
    useEffect(() => {
        console.log('[ROUTER_AUDIT] Guard check:', {
            path: location.pathname,
            hasToken: !!token,
            isVerifyingFirebase,
            isLoading,
            isVerified: profile.isVerified,
            isOnboarded: profile.isOnboarded
        });
    }, [location.pathname, token, isVerifyingFirebase, isLoading, profile]);

    // 1. AUTHENTICATION CHECK
    if (!token) {
        console.log('[ROUTER_AUDIT] No token. Redirecting to /');
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 2. ATOMIC SYNC LOCK - Wait for Firebase verification to complete
    // This prevents routing decisions based on stale emailVerified status
    if (isVerifyingFirebase || isLoading) {
        console.log('[ROUTER_AUDIT] BLOCKED: Waiting for verification/loading...', { isVerifyingFirebase, isLoading });
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>;
    }

    // 3. EMAIL VERIFICATION CHECK - Use fresh profile.isVerified from context
    // Context has already reloaded Firebase and synced the status
    if (!profile.isVerified && location.pathname !== '/verify-email') {
        console.log('[ROUTER_AUDIT] BLOCK: User not verified. Redirecting to /verify-email');
        return <Navigate to="/verify-email" replace />;
    }

    // Prevent verified users from accessing verification page
    if (profile.isVerified && location.pathname === '/verify-email') {
        console.log('[ROUTER_AUDIT] User verified but on /verify-email. Redirecting to /dashboard');
        return <Navigate to="/dashboard" replace />;
    }

    // 4. ONBOARDING CHECK (Only after email is verified)
    const showOnboarding = featureFlags?.onboarding_workflow ?? false;

    if (showOnboarding && profile.isVerified) {
        // Redirect to onboarding if not completed
        if (!profile.isOnboarded && location.pathname !== '/setup-profile') {
            console.log('[ROUTER_AUDIT] FLOW: User not onboarded. Redirecting to /setup-profile');
            return <Navigate to="/setup-profile" replace />;
        }

        // Prevent onboarded users from accessing onboarding page
        if (profile.isOnboarded && location.pathname === '/setup-profile') {
            console.log('[ROUTER_AUDIT] User onboarded but on /setup-profile. Redirecting to /dashboard');
            return <Navigate to="/dashboard" replace />;
        }
    }

    console.log('[ROUTER_AUDIT] All checks passed. Rendering protected content.');
    return <>{children}</>;
}
