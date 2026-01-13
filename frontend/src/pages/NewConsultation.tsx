import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Stethoscope, FileText, Activity, Pill, Weight, Ruler } from 'lucide-react';
import { useDoctor } from '../context/DoctorContext';
import { getApiUrl } from '../config/api';
import BiometryForm from '../components/clinical/BiometryForm';
import AIDiagnosisSearch from '../components/clinical/AIDiagnosisSearch';

export default function NewConsultation() {
    const navigate = useNavigate();
    const { id: patientId } = useParams();
    const { profile, token } = useDoctor();

    const [formData, setFormData] = useState({
        reason: '',
        notes: '',
        diagnosis: '',
        treatment: '',
        weight: '',
        height: '',
        peso_kg: undefined as number | undefined,
        estatura_cm: undefined as number | undefined,
        imc: undefined as number | undefined,
        presion_arterial: undefined as string | undefined,
        frecuencia_cardiaca: undefined as number | undefined,
        temperatura_c: undefined as number | undefined,
        cie10_code: undefined as string | undefined,
        cie10_description: undefined as string | undefined
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Prepare payload matching backend schema
            const payload = {
                reason: formData.reason,
                diagnosis: formData.diagnosis,
                treatment: formData.treatment,
                notes: formData.notes || undefined
            };

            // Prepare headers with authentication
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(getApiUrl(`/api/patients/${patientId}/consultations`), {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || "Error al guardar la consulta");
            }

            // If weight and height provided, update patient IMC
            if (formData.weight && formData.height) {
                const weight = parseFloat(formData.weight);
                const heightInMeters = parseFloat(formData.height) / 100;
                const imc = weight / (heightInMeters * heightInMeters);

                // Update patient IMC (optional - could be done in backend)
                await fetch(getApiUrl(`/api/patients/${patientId}`), {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ imc: parseFloat(imc.toFixed(1)) })
                }).catch(console.error); // Don't fail if IMC update fails
            }

            // Success
            navigate(`/patient/${patientId}`);
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 pt-24">
            <div className="max-w-3xl mx-auto">

                {/* Header Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-500 hover:text-[#1e3a8a] transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancelar y Volver
                </button>

                <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden relative">
                    {/* Decorative Top Border to simulate paper header or clip */}
                    <div className="h-2 bg-[#1e3a8a] w-full"></div>

                    <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">

                        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                            <div>
                                <h1 className="text-3xl font-serif text-slate-800 mb-2">Nueva Consulta</h1>
                                <p className="text-slate-500 text-sm">Registrando atención para el paciente</p>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                <p>{new Date().toLocaleDateString()}</p>
                                <p>{profile.professionalName}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Motivo */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                <Stethoscope className="h-4 w-4 text-[#1e3a8a]" />
                                Motivo de Consulta
                            </label>
                            <input
                                type="text"
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Dolor abdominal agudo..."
                                className="w-full border-0 border-b-2 border-slate-200 focus:border-[#1e3a8a] focus:ring-0 px-0 py-2 text-lg bg-transparent transition-colors placeholder:text-slate-300"
                            />
                        </div>

                        {/* Notas Examen */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                <FileText className="h-4 w-4 text-[#1e3a8a]" />
                                Notas de Examen Físico
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                                className="w-full rounded-md border-slate-200 focus:border-[#1e3a8a] focus:ring-[#1e3a8a] bg-slate-50/50"
                                placeholder="Hallazgos relevantes..."
                            />
                        </div>

                        {/* Diagnóstico */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                <Activity className="h-4 w-4 text-[#1e3a8a]" />
                                Diagnóstico
                            </label>
                            <input
                                type="text"
                                name="diagnosis"
                                value={formData.diagnosis}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Gastritis Aguda"
                                className="w-full border-0 border-b-2 border-slate-200 focus:border-[#1e3a8a] focus:ring-0 px-0 py-2 text-lg font-medium text-slate-800 bg-transparent transition-colors"
                            />
                        </div>

                        {/* Sección de Biometría */}
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-3">Constantes Vitales</h3>
                            <BiometryForm
                                onChange={(data) => setFormData({ ...formData, ...data })}
                            />
                        </div>

                        {/* Sección de Diagnóstico IA */}
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-3">Diagnóstico CIE-10 (IA)</h3>
                            <AIDiagnosisSearch
                                onSelect={(code, desc) => setFormData({
                                    ...formData,
                                    cie10_code: code,
                                    cie10_description: desc
                                })}
                            />
                        </div>

                        {/* Tratamiento (Area Grande) */}
                        <div className="space-y-3 bg-yellow-50/30 p-6 -mx-6 md:-mx-8 border-y border-yellow-100/50">
                            <label className="flex items-center gap-2 text-sm font-bold text-[#1e3a8a] uppercase tracking-wide mb-2">
                                <Pill className="h-4 w-4" />
                                Plan de Tratamiento / Receta
                            </label>
                            <textarea
                                name="treatment"
                                value={formData.treatment}
                                onChange={handleChange}
                                required
                                className="w-full min-h-[200px] border-0 bg-transparent focus:ring-0 text-slate-700 leading-relaxed resize-y placeholder:text-slate-300"
                                placeholder="Escriba aquí las indicaciones, medicamentos y dosis..."
                                style={{ backgroundImage: 'linear-gradient(transparent, transparent 31px, #e2e8f0 31px)', backgroundSize: '100% 32px', lineHeight: '32px' }}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 transform hover:-translate-y-1"
                            >
                                <Save className="h-5 w-5" />
                                {saving ? 'Guardando...' : 'Finalizar Consulta'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
