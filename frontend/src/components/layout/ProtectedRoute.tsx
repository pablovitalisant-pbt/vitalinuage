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

    // Onboarding Guard
    if (featureFlags.onboarding_workflow) {
        // If user is NOT onboarded and tries to access restricted pages (not /onboarding)
        if (!profile.isOnboarded && location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />;
        }

        // If user IS onboarded and tries to access /onboarding
        if (profile.isOnboarded && location.pathname === '/onboarding') {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
}
