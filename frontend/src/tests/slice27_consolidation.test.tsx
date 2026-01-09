import { render, screen, waitFor } from '@testing-library/react';
import PatientProfile from '../pages/PatientProfile';
import { DoctorProvider } from '../context/DoctorContext';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mocks
jest.mock('../context/DoctorContext', () => ({
    useDoctor: () => ({
        token: 'fake-token',
        profile: { id: 1, name: 'Dr. Test' }
    }),
    DoctorProvider: ({ children }: any) => <div>{children}</div>
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ id: '123' }),
    useNavigate: () => jest.fn()
}));

// Mock API calls
global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/patients/123/consultations')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
        } as Response);
    }
    if (url.includes('/api/patients/123')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                id: '123',
                nombre: 'Juan',
                apellido_paterno: 'Perez',
                dni: '12345678',
                fecha_nacimiento: '1980-01-01',
                imc: 24.5,
                blood_type: 'O+', // Data exists but UI is missing
                allergies: ['Polen'],
                chronic_conditions: ['Asma'],
                current_medications: ['Salbutamol']
            })
        } as Response);
    }
    return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({})
    } as Response);
}) as jest.Mock;

describe('PatientProfile Consolidation (Slice 27)', () => {
    it('should display the consolidated "Cards" view with Blood Type', async () => {
        render(
            <BrowserRouter>
                <PatientProfile />
            </BrowserRouter>
        );

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText(/Cargando ficha/i)).not.toBeInTheDocument();
        });

        // Assertion: Check for "Grupo Sanguíneo" which is part of the new "Cards" design (Phase A)
        // This MUST FAIL in Phase B because PatientProfile currently uses MedicalBackgroundManager 
        // which does NOT display Blood Type in a card with this header.
        expect(screen.getByText('Grupo Sanguíneo')).toBeInTheDocument();

        // Optional: Check for unique layout elements from the Cards design if possible, 
        // but text is usually sufficient for a "Red" test.
    });
});
