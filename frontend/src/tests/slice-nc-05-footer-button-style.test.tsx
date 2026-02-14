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

describe('NC-05 footer layout', () => {
    beforeEach(() => {
        authFetchMock.mockReset();
    });

    it('renders footer with Stitch-like button styling and reduced height', async () => {
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

        const footer = document.querySelector('footer') as HTMLElement;
        expect(footer).toHaveClass('bg-white/80');
        expect(footer).toHaveClass('backdrop-blur-md');
        expect(footer).toHaveClass('p-3');

        const saveButton = screen.getByRole('button', { name: /Guardar Consulta/i });
        expect(saveButton).toHaveClass('bg-primary');
        expect(saveButton).toHaveClass('rounded-xl');
        expect(saveButton.querySelector('.material-symbols-outlined')).toBeTruthy();
    });
});
