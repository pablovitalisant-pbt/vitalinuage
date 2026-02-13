import { render, screen } from '@testing-library/react';
import NewConsultation from '../pages/NewConsultation';
import '@testing-library/jest-dom';

jest.mock('../context/DoctorContext', () => ({
    useDoctor: () => ({ profile: { professionalName: 'Dra. Test' } })
}));

jest.mock('../hooks/useAuthFetch', () => ({
    useAuthFetch: () => jest.fn()
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ id: '123' }),
    useNavigate: () => jest.fn()
}));

jest.mock('../components/clinical/BiometryForm', () => () => <div data-testid="biometry-form" />);
jest.mock('../components/clinical/AIDiagnosisSearch', () => () => <div data-testid="ai-diagnosis" />);

describe('RX-02-3 Stitch New Consultation UI', () => {
    it('renders Stitch headings and action button', () => {
        render(<NewConsultation />);

        expect(screen.getByRole('heading', { name: /Nueva Consulta/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Guardar Consulta/i })).toBeInTheDocument();
        expect(screen.getByText(/Padecimiento Actual/i)).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });
});
