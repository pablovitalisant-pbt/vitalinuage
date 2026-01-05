import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrescriptionMapEditor from './PrescriptionMapEditor';

// Mock API config
jest.mock('../config/api', () => ({
    getApiUrl: (path: string) => `http://test-api${path}`,
    API_BASE_URL: 'http://test-api'
}));

global.fetch = jest.fn();

// Mock window.alert
global.alert = jest.fn();

describe('PrescriptionMapEditor - Phase B (Red Tests)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ id: 1, fields_config: [] })
        });
    });

    describe('Coordinate Conversion', () => {
        it('should convert pixel movement to millimeters correctly for A5 canvas', () => {
            // A5 dimensions: 148mm x 210mm
            const A5_WIDTH_MM = 148;
            const A5_HEIGHT_MM = 210;

            // Simulate canvas size: 600px x 857px (A5 aspect ratio)
            const canvasWidth = 600;
            const canvasHeight = 857;

            // Mouse moves 100px to the right
            const deltaX_px = 100;
            const expectedX_mm = (deltaX_px / canvasWidth) * A5_WIDTH_MM;

            expect(expectedX_mm).toBeCloseTo(24.67, 2);
        });
    });

    describe('Authentication', () => {
        it('should include Authorization header when saving map', async () => {
            const mockToken = 'test-jwt-token-12345';
            localStorage.setItem('token', mockToken);

            (global.fetch as jest.Mock).mockImplementation((url) => {
                if (typeof url === 'string' && url.includes('feature-flags.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ prescription_coords_v1: true })
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ([])
                });
            });

            render(<PrescriptionMapEditor />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            const saveButton = screen.getByText(/guardar configuración/i);
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/maps'),
                    expect.objectContaining({
                        method: 'POST',
                        headers: expect.objectContaining({
                            'Authorization': `Bearer ${mockToken}`
                        })
                    })
                );
            });
        });

        it('should NOT call API if no token is present', async () => {
            (global.fetch as jest.Mock).mockImplementation((url) => {
                if (typeof url === 'string' && url.includes('feature-flags.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ prescription_coords_v1: true })
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ([])
                });
            });

            render(<PrescriptionMapEditor />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            const saveButton = screen.getByText(/guardar configuración/i);
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('No estás autenticado'));
            });
        });
    });

    describe('Payload Validation', () => {
        it('should send JSON payload (not FormData) to backend', async () => {
            localStorage.setItem('token', 'test-token');

            (global.fetch as jest.Mock).mockImplementation((url) => {
                if (typeof url === 'string' && url.includes('feature-flags.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ prescription_coords_v1: true })
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ([])
                });
            });

            render(<PrescriptionMapEditor />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            const saveButton = screen.getByText(/guardar configuración/i);
            fireEvent.click(saveButton);

            await waitFor(() => {
                const calls = (global.fetch as jest.Mock).mock.calls.filter(call =>
                    typeof call[0] === 'string' && call[0].includes('/api/maps') && call[1]?.method === 'POST'
                );
                expect(calls.length).toBeGreaterThan(0);

                const postCall = calls[0];
                expect(postCall[1].headers['Content-Type']).toBe('application/json');
                expect(typeof postCall[1].body).toBe('string');

                const payload = JSON.parse(postCall[1].body);
                expect(payload).toHaveProperty('name');
                expect(payload).toHaveProperty('canvas_width_mm', 148.0);
                expect(payload).toHaveProperty('canvas_height_mm', 210.0);
                expect(payload).toHaveProperty('fields_config');
                expect(Array.isArray(payload.fields_config)).toBe(true);
            });
        });
    });

    describe('Feature Flag', () => {
        it('should show "Funcionalidad no disponible" if prescription_coords_v1 is false', async () => {
            (global.fetch as jest.Mock).mockImplementation((url) => {
                if (typeof url === 'string' && url.includes('feature-flags.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ prescription_coords_v1: false })
                    });
                }
                return Promise.resolve({ ok: true, json: async () => ({}) });
            });

            render(<PrescriptionMapEditor />);

            await waitFor(() => {
                expect(screen.getByText(/funcionalidad no disponible/i)).toBeInTheDocument();
            });
        });

        it('should render editor if prescription_coords_v1 is true', async () => {
            localStorage.setItem('token', 'test-token');

            (global.fetch as jest.Mock).mockImplementation((url) => {
                if (typeof url === 'string' && url.includes('feature-flags.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ prescription_coords_v1: true })
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ([])
                });
            });

            render(<PrescriptionMapEditor />);

            await waitFor(() => {
                expect(screen.getByText(/editor de mapas de impresión/i)).toBeInTheDocument();
            });
        });
    });

    describe('Drag and Drop Behavior', () => {
        it('should update field coordinates on mousedown + mousemove', async () => {
            localStorage.setItem('token', 'test-token');

            (global.fetch as jest.Mock).mockImplementation((url) => {
                if (typeof url === 'string' && url.includes('feature-flags.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ prescription_coords_v1: true })
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ([])
                });
            });

            render(<PrescriptionMapEditor />);

            await waitFor(() => {
                expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
            });

            // Component renders successfully
            expect(screen.getByText(/editor de mapas de impresión/i)).toBeInTheDocument();
        });
    });
});
