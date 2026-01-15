
import React from 'react';
import { Mail, LogOut, ArrowRight, RefreshCcw } from 'lucide-react';
import { useDoctor } from '../context/DoctorContext';

// Stub for Firebase Auth (in real app, import auth)
// Since we don't have direct auth import here, we rely on API or localStorage clear
import { getApiUrl } from '../config/api';

export default function VerificationRequired() {
    const { profile, setToken } = useDoctor();

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        window.location.href = '/login'; // Force Full Redirect
    };

    const handleResendEmail = async () => {
        // This would typically trigger a backend endpoint to resend the email
        // or use Firebase's sendEmailVerification()
        alert("Si este fuera el entorno real, se habría reenviado el correo a: " + profile.email);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">

                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                    <Mail size={40} strokeWidth={1.5} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifica tu correo</h1>
                <p className="text-slate-500 mb-6">
                    Hemos enviado un enlace de confirmación a <br />
                    <span className="font-semibold text-slate-700">{profile.email || "tu email"}</span>.
                </p>

                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-8 text-sm text-yellow-800 text-left">
                    <strong>Importante:</strong> Debes verificar tu cuenta antes de poder configurar tu perfil médico y acceder al sistema.
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleResendEmail}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={18} />
                        Reenviar Correo
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        Ya lo verifiqué <ArrowRight size={18} />
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-500 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>

            </div>
        </div>
    );
}
