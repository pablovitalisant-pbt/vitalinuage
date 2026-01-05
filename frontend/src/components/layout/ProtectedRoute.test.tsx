import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { DoctorContext } from '../../context/DoctorContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const MockPublic = () => <div>Login Page</div>;
const MockPrivate = () => <div>Private Content</div>;

describe('ProtectedRoute', () => {
    // Mock setup
    const defaultContext = {
        profile: { professionalName: "Dr. Test", specialty: "GP", address: "", phone: "" },
        preferences: { paperSize: 'A4' as const, templateId: 'classic' as const },
        token: null,
        setToken: jest.fn(),
        updateProfile: jest.fn(),
        updatePreferences: jest.fn(),
        refreshProfile: jest.fn()
    };

    it('redirects to / if token is missing', () => {
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <DoctorContext.Provider value={{ ...defaultContext, token: null }}>
                    <Routes>
                        <Route path="/" element={<MockPublic />} />
                        <Route path="/protected" element={
                            <ProtectedRoute>
                                <MockPrivate />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </DoctorContext.Provider>
            </MemoryRouter>
        );

        // Expectation: Should be on Login Page
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Private Content')).not.toBeInTheDocument();
    });

    it('renders children if token is present', () => {
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <DoctorContext.Provider value={{ ...defaultContext, token: "valid-token" }}>
                    <Routes>
                        <Route path="/protected" element={
                            <ProtectedRoute>
                                <MockPrivate />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </DoctorContext.Provider>
            </MemoryRouter>
        );

        // Expectation: Should see Private Content
        expect(screen.getByText('Private Content')).toBeInTheDocument();
    });
});
