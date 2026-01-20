
import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { useDoctor } from '../context/DoctorContext';
import { useAuthFetch } from '../hooks/useAuthFetch';
import styles from './DeleteAccountModal.module.css'; // Optional: Use module or inline classes

interface DeleteAccountModalProps {
    onClose: () => void;
}

export default function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
    const { profile } = useDoctor();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirmationPhrase = `eliminar mi cuenta vitalinuage/${profile.email}`;
    const isMatched = inputValue === confirmationPhrase;

    const authFetch = useAuthFetch();

    const handleDelete = async () => {
        if (!isMatched) return;

        setIsLoading(true);
        setError(null);

        try {
            // 1. Delete in Backend (Neon)
            const response = await authFetch(getApiUrl('/api/users/me'), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ confirmation_phrase: inputValue })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Error al eliminar la cuenta');
            }

            // 2. Delete in Firebase (If applicable, usually handled by client SDK if loaded)
            // Assuming Firebase Auth instance is available via a hypothetical hook or global
            // For now, we rely on Backend + Local Cleanup as primary.
            // If using Firebase SDK:
            // await auth.currentUser?.delete();

            // 3. Cleanup and Redirect
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';

        } catch (err: any) {
            console.error(err);
            if (err.message !== 'AUTH_TOKEN_MISSING' && err.message !== 'AUTH_401') {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-100 relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 border-4 border-red-100">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">¿Estás absolutamente seguro?</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">
                        Esta acción es <span className="font-bold text-red-600">irreversible</span>.
                        Se eliminarán permanentemente todos tus pacientes, consultas y configuraciones.
                    </p>
                </div>

                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100 mb-6 text-left">
                    <label className="block text-xs font-semibold text-red-800 uppercase tracking-wide mb-2">
                        Para confirmar, escribe:
                    </label>
                    <div className="font-mono text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border border-red-100 select-all">
                        {confirmationPhrase}
                    </div>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Escribe la frase aquí..."
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-50/50 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        autoFocus
                    />

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleDelete}
                        disabled={!isMatched || isLoading}
                        className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:shadow-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Eliminando cuenta...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-5 h-5" />
                                Eliminar mi cuenta permanentemente
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
