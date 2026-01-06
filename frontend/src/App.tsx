import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import PublicValidation from './pages/PublicValidation';
import SearchPage from './pages/Search';
import PatientProfile from './pages/PatientProfile';
import ProfileSettings from './pages/ProfileSettings';
import RegisterPatient from './pages/RegisterPatient';
import NewConsultation from './pages/NewConsultation';
import TalonarioSettings from './pages/TalonarioSettings';
import AuditPanel from './pages/AuditPanel';
import ProtectedLayout from './layouts/ProtectedLayout';
import { DoctorProvider } from './context/DoctorContext';
import OnboardingView from './pages/OnboardingView';

import ProtectedRoute from './components/layout/ProtectedRoute';

import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <DoctorProvider>
            <BrowserRouter>
                <Toaster position="top-right" />
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/verify" element={<VerifyEmail />} />
                    <Route path="/v/:token" element={<PublicValidation />} />

                    {/* Protected Routes */}
                    <Route element={
                        <ProtectedRoute>
                            <ProtectedLayout />
                        </ProtectedRoute>
                    }>
                        <Route path="/dashboard" element={<SearchPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/register" element={<RegisterPatient />} />
                        <Route path="/patient/:id" element={<PatientProfile />} />
                        <Route path="/patient/:id/new-consultation" element={<NewConsultation />} />
                        <Route path="/settings" element={<ProfileSettings />} />
                        <Route path="/settings/talonario" element={<TalonarioSettings />} />
                        <Route path="/settings" element={<ProfileSettings />} />
                        <Route path="/settings/talonario" element={<TalonarioSettings />} />
                        <Route path="/audit" element={<AuditPanel />} />
                        <Route path="/setup-profile" element={<OnboardingView />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </DoctorProvider>
    );
}

export default App;
