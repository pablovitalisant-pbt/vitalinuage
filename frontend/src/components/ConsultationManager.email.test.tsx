import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConsultationManager from './ConsultationManager';

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

describe('ConsultationManager - Email Integration (Slice 07.2)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('token', 'test-token');

        // Mock successful consultations fetch
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ([
                {
                    id: 1,
                    patient_id: 1,
                    motivo_consulta: 'Test',
                    diagnostico: 'Test diagnosis',
                    plan_tratamiento: 'Test treatment',
                    created_at: '2026-01-05T00:00:00Z',
                    patient: {
                        nombre: 'Juan',
                        apellido_paterno: 'Pérez',
                        email: 'juan.perez@test.com',
                        telefono: '1234567890'
                    }
                }
            ])
        });
    });

    describe('Email Button Rendering', () => {
        it('should render Email button for each consultation', async () => {
            render(<ConsultationManager patientId={1} />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            // This will fail because Email button doesn't exist yet
            const emailButton = screen.getByTitle(/enviar por email/i);
            expect(emailButton).toBeInTheDocument();
        });

        it('should display Mail icon in Email button', async () => {
            render(<ConsultationManager patientId={1} />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            // Verify button has "Email" text
            const emailButton = screen.getByText(/^Email$/);
            expect(emailButton).toBeInTheDocument();
        });
    });

    describe('Email Sending Functionality', () => {
        it('should call send-email endpoint when Email button is clicked', async () => {
            render(<ConsultationManager patientId={1} />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            // Reset fetch mock for send-email call
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'queued', message: 'Email queued' })
            });

            // Click Email button
            const emailButton = screen.getByTitle(/enviar por email/i);
            fireEvent.click(emailButton);

            await waitFor(() => {
                // Verify fetch was called with correct endpoint
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/consultas/1/send-email'),
                    expect.objectContaining({
                        method: 'POST',
                        headers: expect.objectContaining({
                            'Authorization': 'Bearer test-token'
                        })
                    })
                );
            });
        });

        it('should show success toast when email is queued', async () => {
            const toast = require('react-hot-toast').default;

            render(<ConsultationManager patientId={1} />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            // Mock successful send-email response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'queued', message: 'Email queued' })
            });

            const emailButton = screen.getByTitle(/enviar por email/i);
            fireEvent.click(emailButton);

            await waitFor(() => {
                // Verify success toast was called
                expect(toast.success || toast).toHaveBeenCalled();
            });
        });

        it('should show error toast when patient has no email', async () => {
            const toast = require('react-hot-toast').default;

            // Mock consultation without patient email
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ([
                    {
                        id: 1,
                        patient_id: 1,
                        motivo_consulta: 'Test',
                        diagnostico: 'Test',
                        plan_tratamiento: 'Test',
                        patient: {
                            nombre: 'Juan',
                            apellido_paterno: 'Pérez',
                            email: null,  // NO EMAIL
                            telefono: '1234567890'
                        }
                    }
                ])
            });

            render(<ConsultationManager patientId={1} />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            const emailButton = screen.getByTitle(/enviar por email/i);
            fireEvent.click(emailButton);

            await waitFor(() => {
                // Verify error toast was called
                expect(toast.error).toHaveBeenCalledWith(
                    expect.stringContaining('email')
                );
            });
        });

        it('should show error toast when API returns error', async () => {
            const toast = require('react-hot-toast').default;

            render(<ConsultationManager patientId={1} />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            // Mock error response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ detail: 'Patient does not have an email address' })
            });

            const emailButton = screen.getByTitle(/enviar por email/i);
            fireEvent.click(emailButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalled();
            });
        });
    });

    describe('Email Button Positioning', () => {
        it('should render Email button alongside WhatsApp and PDF buttons', async () => {
            render(<ConsultationManager patientId={1} />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            // Verify all three buttons exist
            expect(screen.getByTitle(/enviar por whatsapp/i)).toBeInTheDocument();
            expect(screen.getByTitle(/descargar receta pdf/i)).toBeInTheDocument();
            expect(screen.getByTitle(/enviar por email/i)).toBeInTheDocument();
        });
    });
});
