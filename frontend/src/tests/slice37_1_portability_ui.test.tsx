
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfileSettings from '../pages/ProfileSettings';
import '@testing-library/jest-dom';

// Mocks
jest.mock('../context/DoctorContext', () => ({
    DoctorProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useDoctor: () => ({
        profile: { professionalName: 'Test Dr', email: 'test@test.com' },
        preferences: {},
        updateProfile: jest.fn(),
        updatePreferences: jest.fn(),
        refreshProfile: jest.fn(),
        token: 'fake-token',
        isLoading: false
    })
}));

jest.mock('../config/api', () => ({
    API_BASE_URL: 'http://localhost:test',
    getApiUrl: (path: string) => `http://localhost:test/${path}`,
    api: {
        exportData: jest.fn(),
        importData: jest.fn()
    }
}));

jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn()
}));

// Mock Lucide icons to avoid potential SVG/transpilation issues
jest.mock('lucide-react', () => ({
    Download: () => <span data-testid="icon-download">Download</span>,
    Upload: () => <span data-testid="icon-upload">Upload</span>,
    AlertCircle: () => <span>Alert</span>,
    CheckCircle: () => <span>Check</span>,
    FileUp: () => <span>FileUp</span>,
    Loader2: () => <span>Loader</span>,
    Save: () => <span>Save</span>,
    User: () => <span>User</span>,
    Image: () => <span>Image</span>,
    Printer: () => <span>Printer</span>
}));

// Mock Fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({}),
        ok: true,
    })
) as jest.Mock;

describe('Slice 37.1: UI de Portabilidad de Datos', () => {
    test('debe mostrar la sección de Gestión de Datos y Portabilidad', () => {
        render(
            <MemoryRouter>
                <ProfileSettings />
            </MemoryRouter>
        );

        expect(screen.getByText(/Gestión de Datos y Portabilidad/i)).toBeInTheDocument();
    });

    test('debe contener los botones de acción primarios', () => {
        render(
            <MemoryRouter>
                <ProfileSettings />
            </MemoryRouter>
        );

        expect(screen.getByText(/Exportar Información/i)).toBeInTheDocument();
        expect(screen.getByText(/Restaurar Respaldo/i)).toBeInTheDocument();
        expect(screen.getByText(/Descargar Copia de Seguridad/i)).toBeInTheDocument();
        expect(screen.getByText(/Subir Archivo/i)).toBeInTheDocument();
    });
});
