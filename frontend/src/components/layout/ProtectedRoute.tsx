import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext';
import { auth } from '../../config/firebase';

interface ProtectedRouteProps {
    children: ReactNode;
}

import featureFlags from '../../../../config/feature-flags.json';

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { token, profile, isLoading } = useDoctor();
    const location = useLocation();
    const [isCheckingFirebase, setIsCheckingFirebase] = useState(true);
    const [firebaseEmailVerified, setFirebaseEmailVerified] = useState(false);

    // CRITICAL: Check Firebase Auth DIRECTLY - Single Source of Truth
    // This is INDEPENDENT of backend profile state
    useEffect(() => {
        const checkFirebaseVerification = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    // Force reload to get absolute latest status from Firebase servers
                    await user.reload();
                    setFirebaseEmailVerified(user.emailVerified);
                } catch (error) {
                    console.warn('Firebase reload failed:', error);
                    setFirebaseEmailVerified(user.emailVerified);
                }
            }
            setIsCheckingFirebase(false);
        };

        checkFirebaseVerification();
    }, [location.pathname]);

    // 1. AUTHENTICATION CHECK
    if (!token) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 2. WAIT FOR FIREBASE CHECK (Independent of backend)
    if (isCheckingFirebase) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>;
    }

    // 3. EMAIL VERIFICATION CHECK - FIREBASE IS THE SINGLE SOURCE OF TRUTH
    // DO NOT use profile.isVerified (backend can be stale)
    if (!firebaseEmailVerified && location.pathname !== '/verify-email') {
        return <Navigate to="/verify-email" replace />;
    }

    // Prevent verified users from accessing verification page
    if (firebaseEmailVerified && location.pathname === '/verify-email') {
        return <Navigate to="/dashboard" replace />;
    }

    // 4. WAIT FOR BACKEND PROFILE TO LOAD (Only for onboarding check)
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>;
    }

    // 5. ONBOARDING CHECK (Only after email is verified via Firebase)
    const showOnboarding = featureFlags?.onboarding_workflow ?? false;

    if (showOnboarding && firebaseEmailVerified) {
        // Redirect to onboarding if not completed
        if (!profile.isOnboarded && location.pathname !== '/setup-profile') {
            return <Navigate to="/setup-profile" replace />;
        }

        // Prevent onboarded users from accessing onboarding page
        if (profile.isOnboarded && location.pathname === '/setup-profile') {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
}
