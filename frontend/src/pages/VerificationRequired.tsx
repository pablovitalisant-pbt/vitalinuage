
import React from 'react';
import { Mail, LogOut, ArrowRight, RefreshCcw } from 'lucide-react';
import { useDoctor } from '../context/DoctorContext';
import { auth } from '../config/firebase';
import { signOut, sendEmailVerification } from 'firebase/auth';

export default function VerificationRequired() {
    const { profile, setToken } = useDoctor();

    const handleLogout = async () => {
        try {
            // CRITICAL: Firebase signOut + full cleanup
            await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            setToken(null);
            window.location.href = '/'; // NEVER to /login
        } catch (error) {
            console.error('Logout error:', error);
            // Force cleanup even on error
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        }
    };

    const handleResendEmail = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                alert("Correo de verificación reenviado a: " + user.email);
            }
        } catch (error) {
            console.error('Resend email error:', error);
            alert("Error al reenviar el correo. Por favor, intenta más tarde.");
        }
    };

    const handleCheckVerification = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                await user.reload();
                if (user.emailVerified) {
                    window.location.reload(); // Reload to trigger guard re-check
                } else {
                    alert("Tu email aún no ha sido verificado. Por favor, revisa tu bandeja de entrada.");
                }
            }
        } catch (error) {
            console.error('Check verification error:', error);
        }
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
                    <span className="font-semibold text-slate-700">{profile.email || auth.currentUser?.email || "tu email"}</span>.
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
                        onClick={handleCheckVerification}
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
