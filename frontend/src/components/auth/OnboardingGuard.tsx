
import React, { ReactNode } from 'react';
import { useDoctor } from '../../context/DoctorContext';
import { Navigate, useLocation } from 'react-router-dom';
import featureFlags from '../../../../config/feature-flags.json';

interface OnboardingGuardProps {
    children: ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
    const { profile, token } = useDoctor();
    const location = useLocation();

    // 0. Auth Check (Critical since we sometimes bypass ProtectedRoute)
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // 1. Feature Flag Check
    if (!featureFlags.onboarding_workflow) {
        return <>{children}</>;
    }

    // 2. Profile Check
    const isOnboarded = profile.isOnboarded;
    const isSetupPage = location.pathname === '/setup-profile';

    if (!isOnboarded && !isSetupPage) {
        return <Navigate to="/setup-profile" replace />;
    }

    if (isOnboarded && isSetupPage) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
