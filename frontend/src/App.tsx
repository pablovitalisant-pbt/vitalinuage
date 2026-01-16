import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DoctorProvider, useDoctor } from './context/DoctorContext';
import Login from './pages/Login'; // Used as LandingPage
import VerificationRequired from './pages/VerificationRequired';
import Onboarding from './pages/OnboardingPage';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Dashboard Pages Imports
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
import { Toaster } from 'react-hot-toast';

function AppContent() {
    const { user, profile, loading } = useDoctor();

    if (loading) return <LoadingSpinner />;
    if (!user) return <Login />;
    if (!user.emailVerified) return (
        <BrowserRouter>
            <VerificationRequired />
        </BrowserRouter>
    );
    // Allow routing inside VerificationRequired? Previously simplified to component return. 
    // User template had single returns. I'll stick to simple component return if possible, 
    // but VerificationRequired might have internal links.

    if (!profile?.isOnboarded) return (
        <BrowserRouter>
            <Onboarding />
        </BrowserRouter>
    );

    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                <Route element={<DashboardLayout />}>
                    <Route path="/*" element={<HomeSearchView />} />
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
