import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NewConsultation from '../pages/NewConsultation';
import '@testing-library/jest-dom';

const authFetchMock = jest.fn();

jest.mock('../hooks/useAuthFetch', () => ({
    useAuthFetch: () => authFetchMock
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ id: '573' }),
    useNavigate: () => jest.fn()
}));

jest.mock('../components/clinical/BiometryForm', () => () => <div data-testid="biometry-form" />);

describe('NC-04 save wiring', () => {
    beforeEach(() => {
        authFetchMock.mockReset();
    });

    it('clicking Guardar Consulta triggers authFetch POST to consultations', async () => {
        authFetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ nombre: 'Pablo', apellido_paterno: 'Mármol' })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 321 })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });

        render(<NewConsultation />);

        await waitFor(() => {
            expect(authFetchMock).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.getByText('Pablo Mármol')).toBeInTheDocument();
        });

        const reason = document.querySelector('textarea[name=\"reason\"]') as HTMLTextAreaElement;
        const diagnosis = document.querySelector('textarea[name=\"diagnosis\"]') as HTMLTextAreaElement;
        const treatment = document.querySelector('textarea[name=\"treatment\"]') as HTMLTextAreaElement;
        const receta = document.querySelector('textarea[name=\"receta\"]') as HTMLTextAreaElement;

        fireEvent.change(reason, {
            target: { value: 'Dolor abdominal' }
        });
        fireEvent.change(diagnosis, {
            target: { value: 'Gastritis' }
        });
        fireEvent.change(treatment, {
            target: { value: 'Plan A' }
        });
        fireEvent.change(receta, {
            target: { value: 'Paracetamol | 500 mg | cada 8 horas | 5 días' }
        });

        const saveButton = screen.getByRole('button', { name: /Guardar Consulta/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(authFetchMock).toHaveBeenCalledTimes(3);
        });

        const [, secondCall] = authFetchMock.mock.calls;
        expect(secondCall[0]).toContain('/api/patients/573/consultations');
        expect(secondCall[1]?.method).toBe('POST');
    });

    it('shows visible error when form is invalid', async () => {
        authFetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ nombre: 'Pablo', apellido_paterno: 'Mármol' })
        });

        render(<NewConsultation />);

        await waitFor(() => {
            expect(authFetchMock).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.getByText('Pablo Mármol')).toBeInTheDocument();
        });

        const reason = document.querySelector('textarea[name=\"reason\"]') as HTMLTextAreaElement;
        fireEvent.invalid(reason);

        expect(screen.getByText('Completa los campos obligatorios.')).toBeInTheDocument();
    });
});
