/**
 * @jest-environment jsdom
 */
import React from 'react';

// Mock config first
jest.mock('../config/api', () => ({
    getApiUrl: (path: string) => `http://test-api${path}`,
    API_BASE_URL: 'http://test-api'
}));

// Mock firebase
jest.mock('../firebase', () => {
    const mockUser = {
        getIdToken: jest.fn(() => Promise.resolve('test-token')),
        reload: jest.fn(() => Promise.resolve()),
        email: 'test@example.com',
        emailVerified: true,
        uid: 'test-uid'
    };
    return {
        auth: {
            currentUser: mockUser,
            onAuthStateChanged: jest.fn((cb) => {
                cb(mockUser);
                return () => { };
            })
        }
    };
});

// Set global fetch and related objects before other imports
global.fetch = jest.fn();
global.Response = jest.fn() as any;
global.Request = jest.fn() as any;
global.Headers = jest.fn() as any;

import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import PatientTable from '../components/patients/PatientTable';
import { DoctorProvider } from '../context/DoctorContext';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

const mockPatientsPage1 = {
    data: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        full_name: `Patient ${i + 1}`,
        id_number: `DNI${i + 1}`,
        status: 'Activo',
        last_consultation: null
    })),
    total: 25,
    page: 1,
    size: 10
};

const mockPatientsPage2 = {
    data: Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        full_name: `Patient ${i + 11}`,
        id_number: `DNI${i + 11}`,
        status: 'Activo',
        last_consultation: null
    })),
    total: 25,
    page: 2,
    size: 10
};

describe('PatientTable Pagination Loading UI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show skeletons and disable buttons while loading the next page', async () => {
        let resolveFetch: any;
        const fetchPromise = new Promise((resolve) => {
            resolveFetch = resolve;
        });

        (global.fetch as jest.Mock).mockImplementation((url) => {
            if (url.includes('/api/doctors/profile')) {
                return Promise.resolve({ ok: true, json: async () => ({ professionalName: 'Test Doctor' }) });
            }
            if (url.includes('/api/doctors/preferences')) {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            if (url.includes('/api/patients')) {
                const searchParams = new URL(url).searchParams;
                const page = searchParams.get('page');
                if (page === '2') {
                    // Return the promise that we can control
                    return fetchPromise.then(() => ({
                        ok: true,
                        json: async () => mockPatientsPage2
                    }));
                }
                return Promise.resolve({ ok: true, json: async () => mockPatientsPage1 });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(
            <MemoryRouter>
                <DoctorProvider>
                    <PatientTable />
                </DoctorProvider>
            </MemoryRouter>
        );

        // 1. Initial Load
        await waitFor(() => {
            expect(screen.getByText('Patient 1')).toBeInTheDocument();
        });

        // 2. Click Next
        const nextButton = screen.getByRole('button', { name: /siguiente/i });
        fireEvent.click(nextButton);

        // 3. Verify Loading State (Skeletons and Disabled Buttons)
        await waitFor(() => {
            // Check for skeleton rows by test id
            const skeletons = screen.getAllByTestId('patient-row-skeleton');
            expect(skeletons.length).toBe(10);

            // Buttons should be disabled
            expect(nextButton).toBeDisabled();
            expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
        });

        // 4. Resolve fetch
        await act(async () => {
            resolveFetch();
        });

        // 5. Verify Page 2 content
        await waitFor(() => {
            expect(screen.getByText('Patient 11')).toBeInTheDocument();
            expect(screen.queryByTestId('patient-row-skeleton')).not.toBeInTheDocument();
            expect(nextButton).not.toBeDisabled();
        });
    });
});
