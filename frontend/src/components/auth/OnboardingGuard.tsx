
import React, { ReactNode } from 'react';
import { useDoctor } from '../../context/DoctorContext';
import { Navigate, useLocation } from 'react-router-dom';
import featureFlags from '../../../../config/feature-flags.json';

interface OnboardingGuardProps {
    children: ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
    const { profile, token, isLoading } = useDoctor();
    const location = useLocation();

    // 0. Auth Check (Critical since we sometimes bypass ProtectedRoute)
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // Slice SP-04: Loading Guard
    // Prevent premature redirection while profile is being fetched
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Cargando perfil...</p>
                </div>
            </div>
        );
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
