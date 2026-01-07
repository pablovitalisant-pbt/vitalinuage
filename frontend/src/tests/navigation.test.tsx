
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import { DoctorContext, DoctorProfile, PrintPreferences } from '../context/DoctorContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock Feature Flags removed - relying on real file which has true
// If this fails, it is an environment config issue with JSON imports


const mockProfileOnboarded: DoctorProfile = {
    professionalName: 'Dr. Test',
    specialty: 'Test',
    address: 'Test Addr',
    phone: '123',
    registrationNumber: '123',
    isOnboarded: true,
    email: 'test@vitalinuage.com'
};

const mockProfileNotOnboarded: DoctorProfile = {
    ...mockProfileOnboarded,
    isOnboarded: false
};

const mockPreferences: PrintPreferences = {
    paperSize: 'A4',
    templateId: 'classic'
};

// Mock Context Factory
const createMockContext = (profile: DoctorProfile) => ({
    profile,
    preferences: mockPreferences,
    updateProfile: jest.fn(),
    updatePreferences: jest.fn(),
    refreshProfile: jest.fn(),
    token: 'valid-token',
    setToken: jest.fn(),
    completeOnboarding: jest.fn()
});

describe('Navigation Guard', () => {
    // Suppress console.error for clean test output if Navigate causes warnings
    const originalError = console.error;
    beforeAll(() => { console.error = jest.fn(); });
    afterAll(() => { console.error = originalError; });

    it('redirects to /onboarding if user is NOT onboarded', async () => {
        const contextValue = createMockContext(mockProfileNotOnboarded);

        render(
            <DoctorContext.Provider value={contextValue}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <Routes>
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <div>Dashboard Content</div>
                            </ProtectedRoute>
                        } />
                        <Route path="/onboarding" element={<div>Onboarding Page</div>} />
                    </Routes>
                </MemoryRouter>
            </DoctorContext.Provider>
        );

        await waitFor(() => {
            expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
            expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
        });
    });

    it('redirects to /dashboard if user IS onboarded and tries /onboarding', async () => {
        const contextValue = createMockContext(mockProfileOnboarded);

        render(
            <DoctorContext.Provider value={contextValue}>
                <MemoryRouter initialEntries={['/onboarding']}>
                    <Routes>
                        <Route path="/onboarding" element={
                            <ProtectedRoute>
                                <div>Onboarding Page</div>
                            </ProtectedRoute>
                        } />
                        <Route path="/dashboard" element={<div>Dashboard Content</div>} />
                    </Routes>
                </MemoryRouter>
            </DoctorContext.Provider>
        );

        await waitFor(() => {
            expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
            expect(screen.queryByText('Onboarding Page')).not.toBeInTheDocument();
        });
    });
});
