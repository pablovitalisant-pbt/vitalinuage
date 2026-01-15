
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import OnboardingView from '../pages/OnboardingView';
import { DoctorContext, DoctorProfile } from '../context/DoctorContext';
import '@testing-library/jest-dom';

// Mock feature flags to prevent JSON import issues in Jest
jest.mock('../../../config/feature-flags.json', () => ({
    onboarding_workflow: true,
    identity_search_v1: true
}), { virtual: true });

// Utility to render with context
const renderWithContext = (
    ui: React.ReactElement,
    {
        profile = {},
        token = 'valid-token'
    }: { profile?: Partial<DoctorProfile>, token?: string | null } = {}
) => {
    // Ensure all fields are present to satisfy TS matches runtime
    const defaultProfile: DoctorProfile = {
        professionalName: "Test Doc",
        specialty: "",
        address: "",
        phone: "",
        isOnboarded: false,
        email: "test@test.com",
        isVerified: false,
        ...profile
    }; // Removed 'as DoctorProfile' so we see if TS complains

    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <DoctorContext.Provider value={{
                profile: defaultProfile,
                preferences: {} as any,
                updateProfile: jest.fn(),
                updatePreferences: jest.fn(),
                refreshProfile: jest.fn(),
                token,
                setToken: jest.fn(),
                completeOnboarding: jest.fn(),
                isLoading: false,
                authStatusMessage: null
            }}>
                <Routes>
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <div>Dashboard Content</div>
                        </ProtectedRoute>
                    } />
                    <Route path="/verify-email" element={<div>Verify Your Email Screen</div>} />
                    <Route path="/setup-profile" element={<OnboardingView />} />
                </Routes>
            </DoctorContext.Provider>
        </MemoryRouter>
    );
};

describe('Slice 40: Auth Safeguards', () => {

    test('Unverified user should be redirected to Verification Screen', async () => {

        renderWithContext(
            <ProtectedRoute>
                <div>Dashboard</div>
            </ProtectedRoute>,
            {
                profile: { isOnboarded: false, isVerified: false }
            }
        );



        // Expectation: Should see "Verify Your Email Screen"
        await waitFor(() => {
            expect(screen.queryByText(/Verify Your Email Screen/i)).toBeInTheDocument();
            expect(screen.queryByText(/Dashboard/i)).not.toBeInTheDocument();
        });
    });

    test('Onboarding Screen must have a Logout/Exit button', () => {
        render(
            <MemoryRouter>
                <OnboardingView />
            </MemoryRouter>
        );

        const logoutButton = screen.queryByText(/Cerrar Sesión|Salir/i);
        expect(logoutButton).toBeInTheDocument();
    });

});
