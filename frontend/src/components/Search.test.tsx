import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import Search from '../pages/Search';
import { DoctorProvider } from '../context/DoctorContext';
import '@testing-library/jest-dom';

// Fix import.meta.env crash by mocking config
jest.mock('../config/api', () => ({
    getApiUrl: (path: string) => `http://test-api${path}`,
    API_BASE_URL: 'http://test-api'
}));

// Feature Flags are now enabled in config/feature-flags.json, so we rely on the real file.

global.fetch = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
}));

describe('Search Component Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ results: [] })
        });
    });

    const renderWithContext = (ui: React.ReactElement) => {
        // We wrap in DoctorProvider because SearchPage uses useDoctor()
        return render(
            <DoctorProvider>
                {ui}
            </DoctorProvider>
        );
    };

    it('should NOT call Search API if query length < 3', async () => {
        renderWithContext(<Search />);
        const input = screen.getByRole('textbox');

        fireEvent.change(input, { target: { value: 'Te' } });
        fireEvent.submit(input);

        await new Promise(r => setTimeout(r, 500));

        // DoctorProvider might fetch profile, so we specifically check Search API wasn't called
        expect(global.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('/api/pacientes/search')
        );
    });

    it('should call Search API if query length >= 3', async () => {
        renderWithContext(<Search />);
        const input = screen.getByRole('textbox');

        fireEvent.change(input, { target: { value: 'Test' } });
        fireEvent.submit(input);

        // Green Phase: Logic Implemented
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/pacientes/search?q=Test')
            );
        });
    });

    it('should show loading state', async () => {
        // Create a pending promise for Search endpoint
        (global.fetch as jest.Mock).mockImplementation((url) => {
            // DoctorProvider calls profile, let it pass
            if (typeof url === 'string' && (url.includes('/profile') || url.includes('/preferences'))) {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }

            if (typeof url === 'string' && url.includes('/pacientes/search')) {
                return new Promise(() => { }); // Pending
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        renderWithContext(<Search />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'LoadingCheck' } });
        fireEvent.submit(input);

        await waitFor(() => {
            expect(screen.getByText(/buscando/i)).toBeInTheDocument();
        });
    });
});
