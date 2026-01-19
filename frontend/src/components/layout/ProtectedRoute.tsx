import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext';
import { auth } from '../../firebase';
import featureFlags from '../../../../config/feature-flags.json';

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * PROTECTED ROUTE - SLICE 40.7 (FINAL IRON SEAL)
 * Implements "Absolute State Barrier" pattern to eliminate race conditions
 * during login and React StrictMode re-mounts.
 * 
 * CRITICAL: State barrier is checked FIRST, before any authentication logic.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    // Audit Note: Mapping Context props to local guards
    // user -> used to derive token presence
    // loading -> universal loading state
    const { user, profile, loading } = useDoctor();
    const location = useLocation();

    // Derived states for readability
    const hasToken = !!user;
    const isVerifying = loading; // Map loading to verifying for guard logic

    // [AUTH AUDIT] Real-time state audit
    useEffect(() => {
        console.log('[AUTH AUDIT] Guard Check:', {
            path: location.pathname,
            isLoading: loading,
            hasUser: hasToken,
            isVerified: profile?.isVerified,
            isOnboarded: profile?.isOnboarded
        });
    }, [location.pathname, loading, hasToken, profile]);

    // 1. ABSOLUTE STATE BARRIER (MAXIMUM PRIORITY)
    // Do NOT make ANY navigation decisions while system is in transition.
    // This prevents premature redirects when token is momentarily null during re-mounts.
    if (isVerifying) {
        console.log('[AUTH AUDIT] ACTIVE LOCK: Rendering spinner...');
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
    if (!hasToken) {
        console.log('[AUTH AUDIT] Session not found. Redirecting to /');
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 3. EMAIL VERIFICATION CHECK (SOURCE: FIREBASE TRUTH CHECK)
    // bypasses stale React state by asking Firebase directly
    if (!auth.currentUser?.emailVerified) {
        console.log('[AUTH AUDIT] Email not verified (Google Truth). Blocking access.');
        return <Navigate to="/verify-email" replace />;
    }

    // Prevent verified users from accessing verification page
    if (auth.currentUser?.emailVerified && location.pathname === '/verify-email') {
        console.log('[AUTH AUDIT] User verified but on /verify-email. Redirecting to /dashboard');
        return <Navigate to="/dashboard" replace />;
    }

    // 4. ONBOARDING CHECK (SOURCE: BACKEND)
    const showOnboarding = featureFlags?.onboarding_workflow ?? false;

    if (showOnboarding && auth.currentUser?.emailVerified) {
        // Redirect to onboarding if not completed
        if (!profile?.isOnboarded && location.pathname !== '/setup-profile') {
            console.log('[AUTH AUDIT] FLOW: Incomplete profile. Redirecting to onboarding.');
            return <Navigate to="/setup-profile" replace />;
        }

        // Prevent onboarded users from accessing onboarding page
        if (profile?.isOnboarded && location.pathname === '/setup-profile') {
            console.log('[AUTH AUDIT] User onboarded but on /setup-profile. Redirecting to /dashboard');
            return <Navigate to="/dashboard" replace />;
        }
    }

    // 5. ACCESS GRANTED
    console.log('[AUTH AUDIT] Access granted to:', location.pathname);
    return <>{children}</>;
}
