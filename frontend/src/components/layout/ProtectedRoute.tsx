import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

import featureFlags from '../../../../config/feature-flags.json';

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { token, profile } = useDoctor();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Verification Guard (Slice 40)
    // Must be verified to access anything protected
    if (!profile.isVerified && location.pathname !== '/verify-email') {
        return <Navigate to="/verify-email" replace />;
    }

    if (profile.isVerified && location.pathname === '/verify-email') {
        return <Navigate to="/dashboard" replace />;
    }

    // Onboarding Guard
    // Safe Access to Feature Flags
    const showOnboarding = featureFlags?.onboarding_workflow ?? false;

    if (showOnboarding && profile.isVerified) {
        // If user is NOT onboarded and tries to access restricted pages (not /onboarding)
        // Allow /setup-profile as well
        if (!profile.isOnboarded && location.pathname !== '/setup-profile') {
            return <Navigate to="/setup-profile" replace />;
        }

        // If user IS onboarded and tries to access /setup-profile
        if (profile.isOnboarded && location.pathname === '/setup-profile') {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
}
