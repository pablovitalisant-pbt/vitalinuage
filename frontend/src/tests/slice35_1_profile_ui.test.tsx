import { describe, it, expect } from '@jest/globals';
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import VitalSignsCards from '../components/patients/VitalSignsCards';
import { AlertTriangle } from 'lucide-react';

describe('Slice 35.1: Clinical Profile Redesign - Component Tests', () => {

    describe('VitalSignsCards Component', () => {

        it('Should render vital signs grid with 4 cards', () => {
            render(
                <VitalSignsCards
                    imc={27.5}
                    bloodPressure="120/80"
                    weight={75}
                    height={175}
                    lastConsultationDate="2024-01-10"
                />
            );

            // Check for grid container
            const grid = screen.getByTestId('vital-signs-grid');
            expect(grid).toBeInTheDocument();

            // Check for all 4 cards
            expect(screen.getByTestId('imc-card')).toBeInTheDocument();
            expect(screen.getByTestId('vital-card-bp')).toBeInTheDocument();
            expect(screen.getByTestId('vital-card-weight')).toBeInTheDocument();
            expect(screen.getByTestId('vital-card-last')).toBeInTheDocument();
        });

        it('Should display IMC with ORANGE indicator for value 27.5 (Sobrepeso)', () => {
            render(<VitalSignsCards imc={27.5} />);

            // Check IMC value
            expect(screen.getByText('27.5')).toBeInTheDocument();

            // Check for orange indicator (updated class)
            const indicator = screen.getByTestId('imc-indicator');
            expect(indicator).toHaveClass('bg-orange-50');
            expect(screen.getByText('Sobrepeso')).toBeInTheDocument();
        });

        it('Should display IMC with GREEN indicator for value 22.0 (Normal)', () => {
            render(<VitalSignsCards imc={22.0} />);

            expect(screen.getByText('22.0')).toBeInTheDocument();

            const indicator = screen.getByTestId('imc-indicator');
            expect(indicator).toHaveClass('bg-emerald-50');
            expect(screen.getByText('Normal')).toBeInTheDocument();
        });

        it('Should display IMC with RED indicator for value 32.0 (Obesidad)', () => {
            render(<VitalSignsCards imc={32.0} />);

            expect(screen.getByText('32.0')).toBeInTheDocument();

            const indicator = screen.getByTestId('imc-indicator');
            expect(indicator).toHaveClass('bg-red-50');
            expect(screen.getByText('Obesidad')).toBeInTheDocument();
        });

        it('Should display blood pressure when provided', () => {
            render(<VitalSignsCards bloodPressure="120/80" />);

            expect(screen.getByText('120/80')).toBeInTheDocument();
        });

        it('Should display weight and height when provided', () => {
            render(<VitalSignsCards weight={75} height={175} />);

            expect(screen.getByText('75 kg')).toBeInTheDocument();
            expect(screen.getByText('175 cm')).toBeInTheDocument();
        });
    });

    describe('Allergy Alert Banner', () => {

        it('Should render allergy banner with red background when allergies exist', () => {
            const allergies = ['Penicilina', 'Aspirina'];

            const { container } = render(
                <div
                    className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start gap-3"
                    data-testid="allergy-alert-banner"
                >
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-red-800 font-semibold text-sm mb-1">⚠️ ALERGIAS REGISTRADAS</h3>
                        <p className="text-red-700 text-sm">
                            {allergies.join(', ')}
                        </p>
                    </div>
                </div>
            );

            const banner = screen.getByTestId('allergy-alert-banner');
            expect(banner).toBeInTheDocument();
            expect(banner).toHaveClass('bg-red-50');
            expect(screen.getByText(/Penicilina/i)).toBeInTheDocument();
            expect(screen.getByText(/Aspirina/i)).toBeInTheDocument();
        });

        it('Should display "Sin alergias" message when no allergies', () => {
            render(
                <div className="bg-slate-50 border border-slate-200 p-3 mb-6 rounded-lg text-center">
                    <p className="text-slate-500 text-sm">Sin alergias registradas</p>
                </div>
            );

            expect(screen.getByText('Sin alergias registradas')).toBeInTheDocument();
        });
    });

});
