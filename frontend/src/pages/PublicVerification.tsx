import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import apiConfig from '../config/api';

interface VerificationData {
    status: string;
    doctor_name: string;
    patient_initials: string;
    issue_date: string;
    is_expired: boolean;
}

const PublicVerification = () => {
    const { uuid } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<VerificationData | null>(null);

    useEffect(() => {
        const verifyPrescription = async () => {
            try {
                const response = await fetch(`${apiConfig.apiBaseUrl}/api/public/prescriptions/verify/${uuid}`);
                if (!response.ok) {
                    throw new Error("Receta no encontrada o inválida");
                }
                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (uuid) {
            verifyPrescription();
        }
    }, [uuid]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-4 text-center">
                    <h1 className="text-white font-bold tracking-wider text-sm uppercase">Vitalinuage Secure Verify</h1>
                </div>
                <div className="p-8 text-center">
                    {error ? (
                        <>
                            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Verificación Fallida</h2>
                            <p className="text-slate-500 mb-6">{error}</p>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Documento Auténtico</h2>
                            <p className="text-slate-500 mb-6">Esta receta digital ha sido verificada exitosamente en la plataforma Vitalinuage.</p>

                            <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-sm text-slate-500">Médico</span>
                                    <span className="text-sm font-medium text-slate-900">{data?.doctor_name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-sm text-slate-500">Paciente</span>
                                    <span className="text-sm font-medium text-slate-900">{data?.patient_initials}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Fecha Emisión</span>
                                    <span className="text-sm font-medium text-slate-900">{data?.issue_date}</span>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Vitalinuage Verification Platform</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicVerification;
