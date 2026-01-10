import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom';

// Test component that mimics PatientProfile's back button logic
const TestBackButton = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleBack = () => {
        const from = location.state?.from || '/search';
        navigate(from);
    };

    return (
        <div>
            <h1>Test Page</h1>
            <button onClick={handleBack}>Volver</button>
        </div>
    );
};

describe('Smart Back Navigation Logic (Slice 28)', () => {
    it('should navigate back to /patients when state.from is /patients', async () => {
        const initialEntries = [
            { pathname: '/patients' },
            { pathname: '/patients/123', state: { from: '/patients' } }
        ];

        render(
            <MemoryRouter initialEntries={initialEntries} initialIndex={1}>
                <Routes>
                    <Route path="/patients/:id" element={<TestBackButton />} />
                    <Route path="/patients" element={<div data-testid="patients-page">Patients List</div>} />
                    <Route path="/search" element={<div data-testid="search-page">Search Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        // Click back button
        const backButton = screen.getByRole('button', { name: /volver/i });
        fireEvent.click(backButton);

        // Should navigate to /patients
        await waitFor(() => {
            expect(screen.queryByTestId('patients-page')).toBeInTheDocument();
        });
    });

    it('should navigate back to /search when state.from is /search', async () => {
        const initialEntries = [
            { pathname: '/search' },
            { pathname: '/patient/123', state: { from: '/search' } }
        ];

        render(
            <MemoryRouter initialEntries={initialEntries} initialIndex={1}>
                <Routes>
                    <Route path="/patient/:id" element={<TestBackButton />} />
                    <Route path="/patients" element={<div data-testid="patients-page">Patients List</div>} />
                    <Route path="/search" element={<div data-testid="search-page">Search Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        // Click back button
        const backButton = screen.getByRole('button', { name: /volver/i });
        fireEvent.click(backButton);

        // Should navigate to /search
        await waitFor(() => {
            expect(screen.queryByTestId('search-page')).toBeInTheDocument();
        });
    });

    it('should fallback to /search when no navigation state is provided', async () => {
        const initialEntries = [
            { pathname: '/patient/123' }
        ];

        render(
            <MemoryRouter initialEntries={initialEntries} initialIndex={0}>
                <Routes>
                    <Route path="/patient/:id" element={<TestBackButton />} />
                    <Route path="/patients" element={<div data-testid="patients-page">Patients List</div>} />
                    <Route path="/search" element={<div data-testid="search-page">Search Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        // Click back button
        const backButton = screen.getByRole('button', { name: /volver/i });
        fireEvent.click(backButton);

        // Should fallback to /search
        await waitFor(() => {
            expect(screen.queryByTestId('search-page')).toBeInTheDocument();
        });
    });
});
