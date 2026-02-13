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

describe('NC-02 fields 5-9 payload', () => {
    beforeEach(() => {
        authFetchMock.mockReset();
    });

    it('includes receta/interconsulta/licencia/examenes/proximo_control in payload', async () => {
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
        const reason = document.querySelector('textarea[name="reason"]') as HTMLTextAreaElement;
        const diagnosis = document.querySelector('textarea[name="diagnosis"]') as HTMLTextAreaElement;
        const treatment = document.querySelector('textarea[name="treatment"]') as HTMLTextAreaElement;
        const receta = document.querySelector('textarea[name="receta"]') as HTMLTextAreaElement;
        const interconsulta = document.querySelector('textarea[name="interconsulta"]') as HTMLTextAreaElement;
        const licencia = document.querySelector('textarea[name="licencia_medica"]') as HTMLTextAreaElement;
        const examenes = document.querySelector('textarea[name="examenes_solicitados"]') as HTMLTextAreaElement;
        fireEvent.change(reason, { target: { value: 'Dolor abdominal' } });
        fireEvent.change(diagnosis, { target: { value: 'Gastritis' } });
        fireEvent.change(treatment, { target: { value: 'Plan A' } });
        fireEvent.change(receta, { target: { value: 'Paracetamol | 500 mg | cada 8 horas | 5 días' } });
        fireEvent.change(interconsulta, { target: { value: 'Cardiología' } });
        fireEvent.change(licencia, { target: { value: 'Reposo 3 días' } });
        fireEvent.change(examenes, { target: { value: 'Hemograma' } });
        const proximo = document.querySelector('input[name="proximo_control"]') as HTMLInputElement;
        fireEvent.change(proximo, { target: { value: '2026-02-14' } });

        const form = document.querySelector('form') as HTMLFormElement;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(authFetchMock).toHaveBeenCalledTimes(3);
        });

        const consultCall = authFetchMock.mock.calls[1];
        const body = JSON.parse(consultCall[1].body);
        expect(body.receta).toBe('Paracetamol | 500 mg | cada 8 horas | 5 días');
        expect(body.interconsulta).toBe('Cardiología');
        expect(body.licencia_medica).toBe('Reposo 3 días');
        expect(body.examenes_solicitados).toBe('Hemograma');
        expect(body.proximo_control).toBe('2026-02-14');
    });
});
