import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext';
import { auth } from '../../config/firebase';

interface ProtectedRouteProps {
    children: ReactNode;
}

import featureFlags from '../../../../config/feature-flags.json';

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { token, profile } = useDoctor();
    const location = useLocation();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    // CRITICAL: Check Firebase Auth emailVerified in real-time
    useEffect(() => {
        const checkVerification = async () => {
            const user = auth.currentUser;
            if (user) {
                // Force reload to get latest emailVerified status
                await user.reload();
                setIsEmailVerified(user.emailVerified);
            }
            setIsCheckingAuth(false);
        };

        checkVerification();
    }, [auth, location.pathname]);

    // 1. AUTHENTICATION CHECK
    if (!token) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Wait for auth check to complete
    if (isCheckingAuth) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>;
    }

    // 2. EMAIL VERIFICATION CHECK (HIGHEST PRIORITY - INFRANQUEABLE)
    // This MUST come before onboarding check
    if (!isEmailVerified && location.pathname !== '/verify-email') {
        return <Navigate to="/verify-email" replace />;
    }

    // Prevent verified users from accessing verification page
    if (isEmailVerified && location.pathname === '/verify-email') {
        return <Navigate to="/dashboard" replace />;
    }

    // 3. ONBOARDING CHECK (Only after email is verified)
    const showOnboarding = featureFlags?.onboarding_workflow ?? false;

    if (showOnboarding && isEmailVerified) {
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
