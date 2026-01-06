
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OnboardingGuard from './OnboardingGuard';
import { DoctorContext } from '../../context/DoctorContext';
import featureFlags from '../../../../config/feature-flags.json';

// Mock feature flags (Jest style)
// Note: Jest hoisting might prevent inline require mocks if not careful, 
// but since we are mocking a JSON file, let's try standard jest.mock

jest.mock('../../../../config/feature-flags.json', () => ({
    onboarding_workflow: true // Enabled for tests
}));

const MockDashboard = () => <div>Dashboard Content</div>;
const MockSetup = () => <div>Setup Profile</div>;

const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
};

const renderGuard = (isOnboarded: boolean, initialPath: string = '/dashboard') => {
    const contextValue: any = {
        profile: {
            professionalName: 'Dr. Test',
            specialty: '',
            address: '',
            phone: '',
            isOnboarded
        },
        preferences: { paperSize: "A4", templateId: "classic" },
        updateProfile: jest.fn(),
        updatePreferences: jest.fn(),
        refreshProfile: jest.fn(),
        token: 'token',
        setToken: jest.fn(),
        completeOnboarding: jest.fn()
    };

    return render(
        <DoctorContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route
                        path="/dashboard"
                        element={
                            <OnboardingGuard>
                                <MockDashboard />
                            </OnboardingGuard>
                        }
                    />
                    <Route path="/setup-profile" element={<MockSetup />} />
                </Routes>
                <LocationDisplay />
            </MemoryRouter>
        </DoctorContext.Provider>
    );
};

describe('OnboardingGuard', () => {

    it('should redirect to /setup-profile if user is NOT onboarded', async () => {
        renderGuard(false); // Not onboarded

        await waitFor(() => {
            // Must see setup profile content and NOT dashboard content
            expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
            expect(screen.getByTestId('location')).toHaveTextContent('/setup-profile');
        }, { timeout: 1000 });
    });

    it('should allow access if user IS onboarded', async () => {
        renderGuard(true); // Onboarded

        await waitFor(() => {
            expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
        });
    });
});
