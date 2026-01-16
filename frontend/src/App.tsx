import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Context
import { DoctorProvider, useDoctor } from './context/DoctorContext';
import { getApiUrl } from './config/api';

// Pages - Auth & Public
import Login from './pages/Login';
import VerifyAccount from './pages/VerifyAccount';
import VerificationRequired from './pages/VerificationRequired';
import PublicVerification from './pages/PublicVerification';
import PublicValidation from './pages/PublicValidation';
import OnboardingView from './pages/OnboardingView';

// Pages - Dashboard
import DashboardLayout from './components/layout/DashboardLayout';
import HomeSearchView from './pages/HomeSearchView';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientProfile from './pages/PatientProfile';
import RegisterPatient from './pages/RegisterPatient';
import NewConsultation from './pages/NewConsultation';
import ProfileSettings from './pages/ProfileSettings';
import TalonarioSettings from './pages/TalonarioSettings';
import AuditPanel from './pages/AuditPanel';
import PrintPrescription from './pages/PrintPrescription';

function AppContent() {
    const { user, profile, loading } = useDoctor();

    // 1. Loading State (Global Spinner)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    // 2. Unauthenticated State
    if (!user) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/validate-doc/:docToken" element={<PublicValidation />} />
                    <Route path="/v/:uuid" element={<PublicVerification />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        );
    }

    // 3. Unverified State
    if (!user.emailVerified) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/verify-email" element={<VerificationRequired />} />
                    <Route path="/verify" element={<VerifyAccount />} />
                    <Route path="*" element={<Navigate to="/verify-email" replace />} />
                </Routes>
            </BrowserRouter>
        );
    }

    // 4. Onboarding State (Verified but incomplete profile)
    // Ensure profile is loaded before checking isOnboarded
    if (profile && !profile.isOnboarded) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/setup-profile" element={<OnboardingView />} />
                    <Route path="*" element={<Navigate to="/setup-profile" replace />} />
                </Routes>
            </BrowserRouter>
        );
    }

    // 5. Authenticated & Ready (Dashboard)
    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<HomeSearchView />} />
                    <Route path="/metrics" element={<DashboardPage />} />
                    <Route path="/patients" element={<PatientsPage />} />
                    <Route path="/patients/:id" element={<PatientProfile />} />
                    <Route path="/search" element={<HomeSearchView />} />
                    <Route path="/register" element={<RegisterPatient />} />
                    <Route path="/patient/:id" element={<PatientProfile />} />
                    <Route path="/patient/:id/new-consultation" element={<NewConsultation />} />
                    <Route path="/settings" element={<ProfileSettings />} />
                    <Route path="/settings/talonario" element={<TalonarioSettings />} />
                    <Route path="/audit" element={<AuditPanel />} />
                    <Route path="/print/prescription/:id" element={<PrintPrescription />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

function App() {
    return (
        <DoctorProvider>
            <AppContent />
        </DoctorProvider>
    );
}

export default App;
