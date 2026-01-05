import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// 1. Mock the API config to avoid import.meta syntax error during Jest execution
jest.mock('../config/api', () => ({
    getApiUrl: (path: string) => `http://test-api${path}`,
    API_BASE_URL: 'http://test-api'
}));

// Feature Flags are now enabled in config/feature-flags.json, so we rely on the real file.

// 2. Mock Global Fetch
global.fetch = jest.fn();

// Import Context (now safe from import.meta)
import { DoctorProvider, useDoctor } from './DoctorContext';

const TestComponent = () => {
    const { profile } = useDoctor();
    return (
        <div>
            <span data-testid="prof-name">{profile.professionalName}</span>
            <span data-testid="prof-spec">{profile.specialty}</span>
        </div>
    );
};

describe('DoctorContext Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Ensure Token exists for Logic to proceed
        localStorage.setItem('token', 'test-token');

        // Reset fetch to return success by default
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                professional_name: 'Dr. Real API',
                specialty: 'Cardiology',
                registration_number: '12345'
            })
        });
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should fetch profile from API on mount', async () => {
        render(
            <DoctorProvider>
                <TestComponent />
            </DoctorProvider>
        );

        // Wait for Fetch
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/doctor/profile'),
                expect.anything()
            );
        });

        // Wait for State Update & Re-render
        await waitFor(() => {
            expect(screen.getByTestId('prof-name')).toHaveTextContent('Dr. Real API');
        });
    });

    it('should degrade gracefully to "Dr. Vitali" on 500 error', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500
        });

        render(
            <DoctorProvider>
                <TestComponent />
            </DoctorProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('prof-name')).toHaveTextContent('Dr. Vitali');
        });
    });
});
