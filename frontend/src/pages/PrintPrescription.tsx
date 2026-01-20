
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthFetch } from '../hooks/useAuthFetch';
import { getApiUrl } from '../config/api';
import { PrescriptionResponseSchema } from '../contracts/patient';
import { z } from 'zod';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';

type PrescriptionData = z.infer<typeof PrescriptionResponseSchema>;

const PrintPrescription = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const authFetch = useAuthFetch();
    const [data, setData] = useState<PrescriptionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPrescription = async () => {
            if (!id) return;
            try {
                const res = await authFetch(getApiUrl(`/api/patients/prescriptions/${id}`));

                if (!res.ok) throw new Error("No se pudo cargar la receta");

                const json = await res.json();
                const parsed = PrescriptionResponseSchema.parse(json);
                setData(parsed);
            } catch (err: any) {
                console.error(err);
                if (err.message !== 'AUTH_TOKEN_MISSING' && err.message !== 'AUTH_401') {
                    setError("Error al cargar receta.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrescription();
    }, [id]);

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
    );

    if (error || !data) return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <p className="text-red-500 font-medium">{error || "Receta no encontrada"}</p>
            <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Volver</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white text-slate-900">
            {/* Toolbar - Hidden when printing */}
            <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Volver
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                    <Printer size={20} className="mr-2" /> Imprimir Receta
                </button>
            </div>

            {/* Prescription Paper */}
            <div className="max-w-3xl mx-auto bg-white p-12 shadow-xl print:shadow-none print:w-full print:max-w-none print:mx-0 print:p-8 min-h-[29.7cm] relative">

                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dr. {data.doctor_name}</h1>
                        <p className="text-slate-500 font-medium">Medicina General</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800">RECETA MÉDICA</h2>
                        <p className="text-slate-500 text-sm">Folio #{data.id.toString().padStart(6, '0')}</p>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 mb-8 print:bg-transparent print:border-slate-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Paciente</span>
                            <span className="text-lg font-semibold text-slate-900">{data.patient_name}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha de Emisión</span>
                            <span className="text-lg font-semibold text-slate-900">
                                {new Date(data.date).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Medications */}
                <div className="mb-12">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Prescripción</h3>
                    <div className="space-y-6">
                        {data.medications.map((med, idx) => (
                            <div key={idx} className="flex gap-4 items-baseline">
                                <span className="text-slate-400 font-bold w-6">{idx + 1}.</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-lg text-slate-900">{med.name} {med.dosage}</span>
                                        <span className="text-slate-600 font-medium">{med.duration}</span>
                                    </div>
                                    <p className="text-slate-700 italic">
                                        Indicación: {med.frequency} {med.duration && `durante ${med.duration}`}
                                    </p>
                                    {med.notes && <p className="text-slate-500 text-sm mt-1">{med.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer / Signature Area */}
                <div className="absolute bottom-12 left-12 right-12 text-center print:bottom-8">
                    <div className="mb-12 flex justify-center">
                        {/* Signature Line */}
                        <div className="w-64 border-t border-slate-900"></div>
                    </div>
                    <p className="font-bold text-slate-900 text-lg">Dr. {data.doctor_name}</p>
                    <p className="text-slate-500">Médico Cirujano</p>
                    {/* Placeholder for Rut/License */}
                    <p className="text-slate-400 text-sm mt-1">RUT: 12.345.678-9 | Reg. Colegio Médico: 12345</p>
                </div>
            </div>

            <style>
                {`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { -webkit-print-color-adjust: exact; background-color: white; }
                }
                `}
            </style>
        </div>
    );
};

export default PrintPrescription;
