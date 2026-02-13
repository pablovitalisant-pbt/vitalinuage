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

describe('NC-03 footer status', () => {
    beforeEach(() => {
        authFetchMock.mockReset();
    });

    it('does not show status on initial render or typing', async () => {
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
        expect(screen.queryByText('Listo para guardar')).not.toBeInTheDocument();

        const reason = document.querySelector('textarea[name="reason"]') as HTMLTextAreaElement;
        fireEvent.change(reason, { target: { value: 'Dolor' } });
        expect(screen.queryByText('Listo para guardar')).not.toBeInTheDocument();
        expect(reason.value).not.toContain('check_circle');
    });

    it('shows success status after saving', async () => {
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

        const reason = document.querySelector('textarea[name="reason"]') as HTMLTextAreaElement;
        const diagnosis = document.querySelector('textarea[name="diagnosis"]') as HTMLTextAreaElement;
        const treatment = document.querySelector('textarea[name="treatment"]') as HTMLTextAreaElement;
        const receta = document.querySelector('textarea[name="receta"]') as HTMLTextAreaElement;
        fireEvent.change(reason, { target: { value: 'Dolor abdominal' } });
        fireEvent.change(diagnosis, { target: { value: 'Gastritis' } });
        fireEvent.change(treatment, { target: { value: 'Plan A' } });
        fireEvent.change(receta, { target: { value: 'Paracetamol | 500 mg | cada 8 horas | 5 días' } });

        const form = document.querySelector('form') as HTMLFormElement;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText('Listo para guardar')).toBeInTheDocument();
        });
    });

    it('shows error status after failed save', async () => {
        authFetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ nombre: 'Pablo', apellido_paterno: 'Mármol' })
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ detail: 'fail' })
            });

        render(<NewConsultation />);
        await waitFor(() => {
            expect(authFetchMock).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.getByText('Pablo Mármol')).toBeInTheDocument();
        });

        const reason = document.querySelector('textarea[name="reason"]') as HTMLTextAreaElement;
        const diagnosis = document.querySelector('textarea[name="diagnosis"]') as HTMLTextAreaElement;
        const treatment = document.querySelector('textarea[name="treatment"]') as HTMLTextAreaElement;
        const receta = document.querySelector('textarea[name="receta"]') as HTMLTextAreaElement;
        fireEvent.change(reason, { target: { value: 'Dolor abdominal' } });
        fireEvent.change(diagnosis, { target: { value: 'Gastritis' } });
        fireEvent.change(treatment, { target: { value: 'Plan A' } });
        fireEvent.change(receta, { target: { value: 'Paracetamol | 500 mg | cada 8 horas | 5 días' } });

        const form = document.querySelector('form') as HTMLFormElement;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText('Error al guardar')).toBeInTheDocument();
        });
    });
});
