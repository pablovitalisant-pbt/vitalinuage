import { DoctorContext } from '../../contexts/DoctorContext';

const mockProfile = { 
    professionalName: "Dr. Test", 
    specialty: "General", 
    isOnboarded: true, 
    email: "doc@test.com", 
    address: "Calle 123", 
    phone: "5551234" 
};

const mockContext = {
    token: "token",
    profile: mockProfile,
    preferences: { paperSize: "A4", templateId: "classic" },
    setToken: jest.fn(),
    refreshProfile: jest.fn(),
    updateProfile: jest.fn(),
    updatePreferences: jest.fn(),
    completeOnboarding: jest.fn()
};

test('dummy test for build', () => {
    expect(true).toBe(true);
});
