import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DoctorProvider, useDoctor } from './context/DoctorContext';

import Login from './pages/Login';
import VerificationRequired from './pages/VerificationRequired';
import Onboarding from './pages/OnboardingPage';

import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

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

  const resolveRedirectPath = () => {
    if (!user) return '/login';
    if (!user.emailVerified) return '/verify-email';
    // Si aún no existe profile pero ya hay user verificado, mejor esperar (spinner)
    if (!profile) return '/loading';
    if (profile.isOnboarded === false) return '/onboarding';
    return '/dashboard';
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Ruta interna para “esperar profile” sin inventar redirects */}
        <Route path="/loading" element={<LoadingSpinner />} />

        {/* Mientras loading=true (auth/profile en progreso), spinner global */}
        {loading ? (
          <Route path="*" element={<LoadingSpinner />} />
        ) : (
          <>
            <Route path="/" element={<Navigate to={resolveRedirectPath()} replace />} />

            <Route
              path="/login"
              element={user ? <Navigate to={resolveRedirectPath()} replace /> : <Login />}
            />

            <Route
              path="/verify-email"
              element={
                !user ? (
                  <Navigate to="/login" replace />
                ) : user.emailVerified ? (
                  <Navigate to={resolveRedirectPath()} replace />
                ) : (
                  <VerificationRequired />
                )
              }
            />

            <Route
              path="/onboarding"
              element={
                !user ? (
                  <Navigate to="/login" replace />
                ) : !user.emailVerified ? (
                  <Navigate to="/verify-email" replace />
                ) : !profile ? (
                  <Navigate to="/loading" replace />
                ) : profile.isOnboarded === false ? (
                  <Onboarding />
                ) : (
                  <Navigate to={resolveRedirectPath()} replace />
                )
              }
            />

            <Route
              element={
                !user ? (
                  <Navigate to="/login" replace />
                ) : !user.emailVerified ? (
                  <Navigate to="/verify-email" replace />
                ) : !profile ? (
                  <Navigate to="/loading" replace />
                ) : profile.isOnboarded === false ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <DashboardLayout />
                )
              }
            >
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
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </>
        )}
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
