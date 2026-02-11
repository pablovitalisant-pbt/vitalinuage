import { render, screen, waitFor } from '@testing-library/react';
import PatientProfile from '../pages/PatientProfile';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

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

global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/patients/123/consultations')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
        } as Response);
    }
    if (url.includes('/api/medical-background/pacientes/123/antecedentes')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(null)
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
                fecha_nacimiento: '1980-01-01'
            })
        } as Response);
    }
    return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({})
    } as Response);
}) as jest.Mock;

describe('Slice 04: Remove Antecedentes tab', () => {
    it('should render Consultas & Historial and Recetas tabs, but not Antecedentes', async () => {
        render(
            <BrowserRouter>
                <PatientProfile />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Cargando ficha/i)).not.toBeInTheDocument();
        });

        expect(screen.queryByRole('button', { name: /Antecedentes/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Consultas & Historial/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Recetas/i })).toBeInTheDocument();
    });
});
