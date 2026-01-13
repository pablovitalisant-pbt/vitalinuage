
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';

// El mock debe ir ANTES de cualquier importación de componentes
// Usamos el path relativo exacto al archivo de configuración
jest.mock('../config/api', () => ({
    getApiUrl: (path: string) => `http://localhost:8000/${path.replace(/^\//, '')}`
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import BiometryForm from '../components/clinical/BiometryForm';
import AIDiagnosisSearch from '../components/clinical/AIDiagnosisSearch';

// Mock fetch for AI Search
const mockFetch = jest.fn((url: string | URL | Request, init?: RequestInit) =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            suggestions: [
                { code: 'M54.5', description: 'Lumbago no especificado', relevance_reason: 'Match' }
            ]
        }),
    } as Response)
);
// @ts-ignore
globalThis.fetch = mockFetch;

describe('Slice 35: Clinical UI & AI (Green Phase)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('BiometryForm calculates IMC automatically', async () => {
        const mockOnChange = jest.fn();
        render(<BiometryForm onChange={mockOnChange} />);

        const weightInput = screen.getByLabelText(/Peso/i);
        const heightInput = screen.getByLabelText(/Estatura/i);

        fireEvent.change(weightInput, { target: { value: '70' } });
        fireEvent.change(heightInput, { target: { value: '175' } }); // 1.75m

        // IMC = 70 / (1.75^2) = 22.86

        // Check display
        const imcDisplay = await screen.findByText(/22.86/i);
        expect(imcDisplay).toBeInTheDocument();

        // Check callback
        expect(mockOnChange).toHaveBeenCalled();
        // Verify the last call contains correct IMC
        const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
        // @ts-ignore
        expect(lastCall.imc).toBe("22.86");
    });

    it('AIDiagnosisSearch debounces and calls API', async () => {
        jest.useFakeTimers();
        const mockOnSelect = jest.fn();

        render(<AIDiagnosisSearch onSelect={mockOnSelect} />);

        const input = screen.getByPlaceholderText(/Diagnóstico/i);
        fireEvent.change(input, { target: { value: 'Dolor lumbar' } });

        // Initially, fetch should NOT be called (debounce)
        expect(mockFetch).not.toHaveBeenCalled();

        // Fast-forward time wrapped in act
        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        // Wait for fetch to be called
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/diagnosis/suggest-cie10'),
                expect.anything()
            );
        });

        // Wait for suggestions to appear
        const suggestion = await screen.findByText('M54.5');
        expect(suggestion).toBeInTheDocument();

        // Click suggestion
        fireEvent.click(suggestion);
        expect(mockOnSelect).toHaveBeenCalledWith('M54.5', 'Lumbago no especificado');

        jest.useRealTimers();
    });

});
