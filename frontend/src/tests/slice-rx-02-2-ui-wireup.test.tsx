import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NewConsultation from '../pages/NewConsultation';
import '@testing-library/jest-dom';

const authFetchMock = jest.fn();
const navigateMock = jest.fn();

jest.mock('../context/DoctorContext', () => ({
    useDoctor: () => ({ profile: { professionalName: 'Dr. Test' } })
}));

jest.mock('../hooks/useAuthFetch', () => ({
    useAuthFetch: () => authFetchMock
}));

jest.mock('../config/api', () => ({
    getApiUrl: (path: string) => path
}));

jest.mock('../components/clinical/BiometryForm', () => () => <div data-testid="biometry-form" />);
jest.mock('../components/clinical/AIDiagnosisSearch', () => () => <div data-testid="ai-diagnosis" />);

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ id: '123' }),
    useNavigate: () => navigateMock
}));

describe('RX-02-2 UI wireup', () => {
    beforeEach(() => {
        authFetchMock.mockReset();
        navigateMock.mockReset();
    });

    const getRecetaTextarea = () => {
        const byName = document.querySelector('textarea[name="treatment"]') as HTMLTextAreaElement | null;
        if (byName) return byName;
        const byLabel = screen.queryByLabelText(/Plan de Tratamiento \/ Receta/i) as HTMLTextAreaElement | null;
        if (byLabel) return byLabel;
        return screen.getByPlaceholderText('Escriba aquí las indicaciones, medicamentos y dosis...') as HTMLTextAreaElement;
    };

    const fillRequiredFields = () => {
        const reason = document.querySelector('input[name="reason"]') as HTMLInputElement | null;
        if (reason) fireEvent.change(reason, { target: { value: 'Dolor' } });
        const diagnosis = document.querySelector('input[name="diagnosis"]') as HTMLInputElement | null;
        if (diagnosis) fireEvent.change(diagnosis, { target: { value: 'Dx' } });
    };

    it('invalid receta shows error and does not POST', async () => {
        render(<NewConsultation />);
        fillRequiredFields();
        const receta = getRecetaTextarea();
        fireEvent.change(receta, { target: { value: 'Paracetamol | 500 mg | cada 8 horas' } });

        const form = document.querySelector('form') as HTMLFormElement;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(
                screen.getByText(
                    "Cada línea debe tener 4 campos separados por '|': Nombre | Dosis | Frecuencia | Duración"
                )
            ).toBeInTheDocument();
        });

        expect(authFetchMock).not.toHaveBeenCalled();
    });

    it('valid receta posts consultation then prescription', async () => {
        authFetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 123 })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });

        render(<NewConsultation />);
        fillRequiredFields();
        const receta = getRecetaTextarea();
        fireEvent.change(receta, { target: { value: 'Paracetamol | 500 mg | cada 8 horas | 5 días' } });

        const form = document.querySelector('form') as HTMLFormElement;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(authFetchMock).toHaveBeenCalledTimes(2);
        });

        const firstCall = authFetchMock.mock.calls[0];
        expect(firstCall[0]).toBe('/api/patients/123/consultations');

        const secondCall = authFetchMock.mock.calls[1];
        expect(secondCall[0]).toBe('/api/patients/consultations/123/prescription');
        expect(JSON.parse(secondCall[1].body)).toEqual({
            consultation_id: 123,
            medications: [
                {
                    name: 'Paracetamol',
                    dosage: '500 mg',
                    frequency: 'cada 8 horas',
                    duration: '5 días'
                }
            ]
        });
    });

    it('empty receta posts consultation only', async () => {
        authFetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ consultation_id: 456 })
        });

        render(<NewConsultation />);
        fillRequiredFields();
        const receta = getRecetaTextarea();
        fireEvent.change(receta, { target: { value: '   ' } });

        const form = document.querySelector('form') as HTMLFormElement;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(authFetchMock).toHaveBeenCalledTimes(1);
        });

        expect(authFetchMock.mock.calls[0][0]).toBe('/api/patients/123/consultations');
    });
});
