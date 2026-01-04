/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { DoctorProvider } from '../context/DoctorContext';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock Hook
jest.mock('../hooks/usePatients', () => ({
    usePatients: () => ({
        patients: [],
        loading: false,
        error: null,
        isEmpty: true // Specific state we are testing
    })
}));

describe('Dashboard Component', () => {
    it('shows empty state message when no patients found', () => {
        render(
            <MemoryRouter>
                <DoctorProvider>
                    <Dashboard />
                </DoctorProvider>
            </MemoryRouter>
        );

        expect(screen.getByText(/No tienes pacientes asignados/i)).toBeInTheDocument();
    });
});
