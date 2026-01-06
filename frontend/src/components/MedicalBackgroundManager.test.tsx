import { render, screen, waitFor } from '@testing-library/react';
// import { describe, it, expect, vi } from 'vitest';
import MedicalBackgroundManager from './MedicalBackgroundManager';

// Mock fetch
// global.fetch = vi.fn();
global.fetch = jest.fn();

describe('MedicalBackgroundManager', () => {
    const mockPatientId = 123;

    it('renders loading state initially', () => {
        render(<MedicalBackgroundManager patientId={mockPatientId} />);
        expect(screen.getByText(/cargando antecedentes/i)).toBeInTheDocument();
    });

    it('displays form fields after loading', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                patient_id: 123,
                patologicos: "None",
                no_patologicos: "None"
            })
        });

        render(<MedicalBackgroundManager patientId={mockPatientId} />);

        await waitFor(() => {
            expect(screen.getByLabelText(/pathological/i)).toBeInTheDocument();
        });
    });
});
