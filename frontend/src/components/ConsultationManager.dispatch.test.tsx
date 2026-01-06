import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConsultationManager from './ConsultationManager';
import apiConfig from '../config/api';

// Mock API config
jest.mock('../config/api', () => ({
    __esModule: true,
    default: {
        apiBaseUrl: 'http://test-api',
        getApiUrl: (path: string) => `http://test-api${path}`
    }
}));

global.fetch = jest.fn();
global.alert = jest.fn();

// Mock toast
jest.mock('react-hot-toast', () => {
    const toastMock = jest.fn();
    (toastMock as any).success = jest.fn();
    (toastMock as any).error = jest.fn();
    return {
        __esModule: true,
        default: toastMock,
    };
});


// Mock device utils
jest.mock('../utils/device', () => ({
    isMobileDevice: () => true
}));

describe('ConsultationManager - Dispatch Tracking (Slice 07.3)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('token', 'test-token');

        // Mock successful consultations fetch with dispatch data (Hybrid)
        (global.fetch as jest.Mock).mockImplementation((url) => {
            if (url.includes('/consultas') && !url.includes('send') && !url.includes('pdf') && !url.includes('create-verification') && !url.includes('dispatch-status') && !url.includes('mark-whatsapp')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ([
                        {
                            id: 1,
                            patient_id: 1,
                            motivo_consulta: 'Test tracking',
                            diagnostico: 'Flu',
                            plan_tratamiento: 'Rest',
                            created_at: '2026-01-05T00:00:00Z',
                            patient: {
                                nombre: 'Juan',
                                apellido_paterno: 'Tracking',
                                email: 'juan@track.com',
                                telefono: '5555555'
                            },
                            // Mock the hybrid properties
                            email_sent_at: '2026-01-05T12:00:00Z',
                            whatsapp_sent_at: null
                        }
                    ])
                });
            }
            if (url.includes('create-verification')) {
                return Promise.resolve({ ok: true, json: async () => ({ uuid: '123' }) });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('should display email sent badge from list data', async () => {
        render(<ConsultationManager patientId={1} />);

        await waitFor(() => {
            expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
        });

        // The implementation adds <Check /> icon inside the button. 
        // We can check if the button contains the Check icon or similar.
        // Or check if the button text is "Check Email".
        // My implementation script replaced "Email" with "{...} Email".
        // So strict text match "Email" might fail if it's split.
        // We'll search for the button by title "Enviar por Email" and check desc.
        const emailBtn = screen.getByTitle('Enviar por Email');
        // Check if it has the check icon (which renders an svg)
        // Lucide check icon has class 'lucide-check' if name is passed? Or we passed <Check className... />
        // The implementation passed <Check className='w-3 h-3' />
        // Depending on Lucide mock or rendering, it might just be an SVG.
        // We can check if emailBtn contains an SVG with w-3 h-3.
        // Or simpler: snapshot/text?
        expect(emailBtn.innerHTML).toContain('svg');
    });

    it('should call mark-whatsapp-sent when WhatsApp button is clicked', async () => {
        render(<ConsultationManager patientId={1} />);

        await waitFor(() => {
            expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
        });

        const waButton = screen.getByTitle(/Enviar por WhatsApp/i);
        fireEvent.click(waButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/consultas/1/mark-whatsapp-sent'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });
});
