import { render, screen } from '@testing-library/react';
import Header from './Header';
import { DoctorContext } from '../../contexts/DoctorContext';
import { BrowserRouter } from 'react-router-dom';

const mockContext = {
    profile: { 
        professionalName: "Dr. Test", 
        specialty: "Cardiology", 
        isOnboarded: true, 
        email: "test@example.com", 
        address: "Calle 123", 
        phone: "5551234" 
    },
    preferences: { paperSize: "A4", templateId: "classic" },
    token: "valid-token",
    setToken: jest.fn(),
    refreshProfile: jest.fn(),
    updateProfile: jest.fn(),
    completeOnboarding: jest.fn(),
    updatePreferences: jest.fn()
};

test('renders brand name', () => {
    render(
        <BrowserRouter>
            <DoctorContext.Provider value={mockContext as any}>
                <Header />
            </DoctorContext.Provider>
        </BrowserRouter>
    );
    expect(screen.getByText(/Vitalinuage/i)).toBeInTheDocument();
});
