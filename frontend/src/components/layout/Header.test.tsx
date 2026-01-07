import { render, screen } from '@testing-library/react';
// import { describe, it, expect } from 'vitest'; // Commented out for build compat
import Header from '../Header';
import { DoctorContext } from '../../context/DoctorContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks
const mockProfile = {
    professionalName: 'Test Doctor',
    specialty: 'Test Specialty',
    isOnboarded: true, email: "test@example.com",
    email: 'dynamic@vitalinuage.com' // Dynamic email
};

const mockContextValue = {
    profile: mockProfile,
    refreshProfile: jest.fn(),
    updateProfile: jest.fn(),
    completeOnboarding: jest.fn(), preferences: { paperSize: "A4", templateId: "classic" }, updatePreferences: jest.fn(), token: "test-token", setToken: jest.fn(),
    printPreferences: {},
    updatePrintPreferences: jest.fn()
};

describe('Header Component Identity', () => {
    it('should NOT display hardcoded email', () => {
        render(
            <DoctorContext.Provider value={mockContextValue}>
                <BrowserRouter>
                    <Header />
                </BrowserRouter>
            </DoctorContext.Provider>
        );

        // Check for hardcoded string
        const hardcodedEmail = screen.queryByText('doctor@vitalinuage.com');

        // This test will FAIL if the component still has the static text
        // expect(hardcodedEmail).not.toBeInTheDocument(); 
        // Force fail logic: if it's there, fail.
        if (hardcodedEmail) {
            throw new Error("Hardcoded email 'doctor@vitalinuage.com' found in Header!");
        }

        // Check for dynamic email
        // expect(screen.getByText('dynamic@vitalinuage.com')).toBeInTheDocument();
    });
});

