import { render, screen, waitFor } from '@testing-library/react';
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

describe('NC-01 patient info', () => {
    beforeEach(() => {
        authFetchMock.mockReset();
    });

    it('renders patient fields from API', async () => {
        authFetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                nombre: 'Pablo',
                apellido_paterno: 'Mármol',
                apellido_materno: '',
                dni: '12.345.678-9',
                fecha_nacimiento: '1980-02-10',
                sexo: 'Masculino',
                telefono: '+56 9 8765 4321',
                nacionalidad: 'Chilena',
                direccion: 'Calle Falsa 123',
                comuna: 'Providencia'
            })
        });

        render(<NewConsultation />);

        await waitFor(() => {
            expect(authFetchMock).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.getByText('Pablo Mármol')).toBeInTheDocument();
        });
        expect(screen.getByText('12.345.678-9')).toBeInTheDocument();
        expect(screen.getByText('Masculino')).toBeInTheDocument();
        expect(screen.getByText('+56 9 8765 4321')).toBeInTheDocument();
        expect(screen.getByText('Chilena')).toBeInTheDocument();
        expect(screen.getByText('Calle Falsa 123')).toBeInTheDocument();
        expect(screen.getByText('Providencia')).toBeInTheDocument();
    });
});
