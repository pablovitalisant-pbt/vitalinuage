import { render, screen } from '@testing-library/react';
import RegisterPatient from './RegisterPatient';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
    Toaster: () => null
}));

describe('RegisterPatient Component', () => {
    test('renders without crashing', () => {
        render(
            <BrowserRouter>
                <RegisterPatient />
            </BrowserRouter>
        );

        // Verify key elements are present
        expect(screen.getByText(/nuevo paciente/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });

    test('has submit button in correct initial state', () => {
        render(
            <BrowserRouter>
                <RegisterPatient />
            </BrowserRouter>
        );

        const submitButton = screen.getByRole('button', { name: /guardar/i });
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent(/guardar y abrir ficha/i);
    });
});
