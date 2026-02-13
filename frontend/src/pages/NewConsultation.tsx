import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { useDoctor } from '../context/DoctorContext';
import { useAuthFetch } from '../hooks/useAuthFetch';
import { getApiUrl } from '../config/api';
import BiometryForm from '../components/clinical/BiometryForm';
import AIDiagnosisSearch from '../components/clinical/AIDiagnosisSearch';
import { parseRecetaToMedications } from '../lib/recetaParser';
import { runRecetaSubmitFlow } from '../lib/recetaSubmitFlow';

export default function NewConsultation() {
    const navigate = useNavigate();
    const { id: patientId } = useParams();
    const { profile } = useDoctor();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const [formData, setFormData] = useState({
        reason: '',
        notes: '',
        diagnosis: '',
        treatment: '',
        alergias: '',
        patologicos: '',
        no_patologicos: '',
        heredofamiliares: '',
        quirurgicos: '',
        medicamentos_actuales: '',
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

    const authFetch = useAuthFetch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const toNumber = (value: string | number | undefined) => {
                if (value === '' || value === null || value === undefined) return undefined;
                const parsed = typeof value === 'number' ? value : Number(value);
                return Number.isFinite(parsed) ? parsed : undefined;
            };

            // Prepare payload matching backend schema
            const payload = {
                reason: formData.reason,
                diagnosis: formData.diagnosis,
                treatment: formData.treatment,
                notes: formData.notes || undefined,
                alergias: formData.alergias,
                patologicos: formData.patologicos,
                no_patologicos: formData.no_patologicos,
                heredofamiliares: formData.heredofamiliares,
                quirurgicos: formData.quirurgicos,
                medicamentos_actuales: formData.medicamentos_actuales,
                peso_kg: toNumber(formData.peso_kg),
                estatura_cm: toNumber(formData.estatura_cm),
                presion_arterial: formData.presion_arterial || undefined,
                frecuencia_cardiaca: toNumber(formData.frecuencia_cardiaca),
                temperatura_c: toNumber(formData.temperatura_c),
                imc: toNumber(formData.imc)
            };

            const result = await runRecetaSubmitFlow({
                recetaText: formData.treatment,
                parseReceta: parseRecetaToMedications,
                postConsultation: async () => {
                    const res = await authFetch(getApiUrl(`/api/patients/${patientId}/consultations`), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.detail || "Error al guardar la consulta");
                    }

                    return res.json();
                },
                postPrescription: async (consultationId, medications) => {
                    const res = await authFetch(getApiUrl(`/api/patients/consultations/${consultationId}/prescription`), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            consultation_id: consultationId,
                            medications
                        })
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.detail || "Error al guardar la receta");
                    }
                }
            });

            if (!result.ok) {
                setError(result.error);
                return;
            }

            // If weight and height provided, update patient IMC
            if (formData.weight && formData.height) {
                const weight = parseFloat(formData.weight);
                const heightInMeters = parseFloat(formData.height) / 100;
                const imc = weight / (heightInMeters * heightInMeters);

                // Update patient IMC (optional - could be done in backend)
                await authFetch(getApiUrl(`/api/patients/${patientId}`), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
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
        <div className="bg-background-light dark:bg-background-dark text-[#111318] min-h-screen">
            <aside
                id="sidebar"
                className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 z-[60] transition-all duration-300"
            >
                <div className="mb-12">
                    <span className="text-3xl text-primary font-black">V</span>
                </div>
                <nav className="flex flex-col gap-8">
                    <div className="p-3 rounded-xl hover:bg-primary/5 text-slate-400 hover:text-primary transition-all group relative">
                        <span className="text-3xl">home</span>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10 text-primary transition-all group relative">
                        <span className="text-3xl">group</span>
                    </div>
                    <div className="p-3 rounded-xl hover:bg-primary/5 text-slate-400 hover:text-primary transition-all group relative">
                        <span className="text-3xl">bar_chart</span>
                    </div>
                </nav>
                <div className="mt-auto">
                    <button className="p-3 rounded-xl hover:bg-slate-100 text-slate-400 transition-all" type="button">
                        <span className="text-3xl">chevron_right</span>
                    </button>
                </div>
            </aside>

            <header className="bg-white dark:bg-background-dark border-b border-primary/10 sticky top-0 z-50 pl-20">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="text-slate-500 font-medium">{formattedDate}</div>
                    <div className="flex items-center gap-4">
                        <div className="text-right mr-2">
                            <p className="text-sm font-bold text-[#111318]">{profile.professionalName}</p>
                            <p className="text-xs text-slate-500">Profesional</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                            <span className="text-primary text-xl font-bold">
                                {profile.professionalName?.charAt(0) || 'D'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 pl-20">
                <form onSubmit={handleSubmit} id="new-consultation-form" className="space-y-16 pb-32">
                    <div className="mb-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div>
                                <h1 className="text-4xl font-black text-[#111318] tracking-tight">Nueva Consulta</h1>
                                <div className="flex flex-wrap items-baseline gap-3 mt-2">
                                    <span className="text-slate-400 text-2xl font-light">Paciente:</span>
                                    <h2 className="text-4xl font-black text-[#111318] tracking-tight">
                                        ID {patientId}
                                    </h2>
                                </div>
                            </div>
                            <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/10 text-center min-w-[200px]">
                                <p className="text-sm uppercase tracking-widest font-bold text-primary mb-1">
                                    Fecha de Consulta
                                </p>
                                <p className="text-3xl font-black text-primary">
                                    {formattedDate}
                                </p>
                                <p className="text-lg font-bold text-primary/60">{formattedTime}</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <section className="mb-16 bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <span className="material-symbols-outlined">person</span> Información del Paciente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Edad</label>
                                <p className="text-2xl font-bold text-[#111318]">N/D</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Sexo</label>
                                <p className="text-2xl font-bold text-[#111318]">N/D</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">RUT o DNI</label>
                                <p className="text-2xl font-bold text-[#111318]">ID {patientId}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Fecha de Nacimiento</label>
                                <p className="text-2xl font-bold text-[#111318]">N/D</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Número de Celular</label>
                                <p className="text-2xl font-bold text-primary">N/D</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Nacionalidad</label>
                                <p className="text-2xl font-bold text-[#111318]">N/D</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Domicilio</label>
                                <p className="text-2xl font-bold text-[#111318]">N/D</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Comuna</label>
                                <p className="text-2xl font-bold text-[#111318]">N/D</p>
                            </div>
                        </div>
                    </section>

                    <section className="group">
                        <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                            <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">1</span>
                            Padecimiento Actual
                        </label>
                        <textarea
                            id="padecimiento"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                            rows={4}
                            placeholder="Describa el motivo y evolución de la molestia..."
                            className="w-full text-2xl p-8 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300 bg-white"
                        />
                    </section>

                    <section className="group">
                        <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                            <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">2</span>
                            Examen Físico
                        </label>
                        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 focus-within:border-primary transition-all mb-6">
                            <BiometryForm onChange={(data) => setFormData({ ...formData, ...data })} />
                        </div>
                        <textarea
                            id="examen"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Observaciones generales, signos vitales, etc."
                            className="w-full text-2xl p-8 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300 bg-white"
                        />
                    </section>

                    <section className="group">
                        <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                            <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">3</span>
                            Impresión Diagnóstica
                        </label>
                        <textarea
                            id="diagnostico"
                            name="diagnosis"
                            value={formData.diagnosis}
                            onChange={handleChange}
                            required
                            rows={3}
                            placeholder="Diagnóstico principal y CIE-10..."
                            className="w-full text-2xl p-8 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300 bg-white font-mono"
                        />
                        <div className="mt-6">
                            <AIDiagnosisSearch
                                onSelect={(code, desc) => setFormData({
                                    ...formData,
                                    cie10_code: code,
                                    cie10_description: desc
                                })}
                            />
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border-2 border-slate-100 bg-white p-8">
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined">person</span> Antecedentes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alergias</label>
                                <textarea
                                    name="alergias"
                                    value={formData.alergias}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-primary/5 bg-white p-4"
                                    placeholder="Sin datos registrados..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Antecedentes Patológicos</label>
                                <textarea
                                    name="patologicos"
                                    value={formData.patologicos}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-primary/5 bg-white p-4"
                                    placeholder="Sin datos registrados..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No Patológicos</label>
                                <textarea
                                    name="no_patologicos"
                                    value={formData.no_patologicos}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-primary/5 bg-white p-4"
                                    placeholder="Sin datos registrados..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Heredofamiliares</label>
                                <textarea
                                    name="heredofamiliares"
                                    value={formData.heredofamiliares}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-primary/5 bg-white p-4"
                                    placeholder="Sin datos registrados..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quirúrgicos</label>
                                <textarea
                                    name="quirurgicos"
                                    value={formData.quirurgicos}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-primary/5 bg-white p-4"
                                    placeholder="Sin datos registrados..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicamentos Actuales</label>
                                <textarea
                                    name="medicamentos_actuales"
                                    value={formData.medicamentos_actuales}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-primary/5 bg-white p-4"
                                    placeholder="Sin datos registrados..."
                                />
                            </div>
                        </div>
                    </section>

                    <section className="group">
                        <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                            <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">4</span>
                            Plan de Tratamiento
                        </label>
                        <textarea
                            id="tratamiento"
                            name="treatment"
                            value={formData.treatment}
                            onChange={handleChange}
                            required
                            rows={5}
                            placeholder="Escriba el plan de tratamiento detallado..."
                            className="w-full text-2xl p-8 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300 bg-white"
                        />
                    </section>

                    <section className="group">
                        <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                            <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">5</span>
                            Receta
                        </label>
                        <div className="w-full text-xl p-6 rounded-2xl border-2 border-slate-200 bg-white text-slate-500">
                            La receta se genera desde el Plan de Tratamiento.
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <section className="group">
                            <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                                <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">6</span>
                                Interconsulta
                            </label>
                            <div className="w-full text-xl p-6 rounded-2xl border-2 border-slate-200 bg-white text-slate-400">
                                Sin datos en este formulario.
                            </div>
                        </section>
                        <section className="group">
                            <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                                <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">7</span>
                                Licencia Médica
                            </label>
                            <div className="w-full text-xl p-6 rounded-2xl border-2 border-slate-200 bg-white text-slate-400">
                                Sin datos en este formulario.
                            </div>
                        </section>
                    </div>

                    <section className="group">
                        <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                            <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">8</span>
                            Exámenes Solicitados
                        </label>
                        <div className="w-full text-xl p-6 rounded-2xl border-2 border-slate-200 bg-white text-slate-400">
                            Sin datos en este formulario.
                        </div>
                    </section>

                    <section className="group">
                        <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                            <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">9</span>
                            Fecha del Próximo Control
                        </label>
                        <div className="w-full text-xl p-6 rounded-2xl border-2 border-slate-200 bg-white text-slate-400 max-w-md">
                            Sin datos en este formulario.
                        </div>
                    </section>
                </form>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-6 z-40 pl-20">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 text-slate-500 font-medium">
                        <span className="text-green-500">check_circle</span>
                        {saving ? 'Guardando...' : 'Listo para guardar'}
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 md:flex-none px-10 py-5 text-xl font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="new-consultation-form"
                            disabled={saving}
                            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-xl text-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-6 w-6" />
                            Guardar Consulta
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
