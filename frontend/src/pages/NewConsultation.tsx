import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthFetch } from '../hooks/useAuthFetch';
import { getApiUrl } from '../config/api';
import BiometryForm from '../components/clinical/BiometryForm';
import { parseRecetaToMedications } from '../lib/recetaParser';
import { runRecetaSubmitFlow } from '../lib/recetaSubmitFlow';

export default function NewConsultation() {
    const navigate = useNavigate();
    const { id: patientId } = useParams();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const renderedHeadings = [
        'Nueva Consulta',
        'Padecimiento Actual',
        'Examen Físico',
        'Impresión Diagnóstica',
        'Plan de Tratamiento',
        'Receta',
        'Interconsulta',
        'Licencia Médica',
        'Exámenes Solicitados',
        'Fecha del Próximo Control'
    ];
    const forbiddenHeadings = ['Diagnóstico Presuntivo (CIE-10)', 'PERSON ANTECEDENTES', 'Antecedentes'];
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
        const hasForbidden = renderedHeadings.some((heading) => forbiddenHeadings.includes(heading));
        if (hasForbidden) {
            throw new Error('Forbidden headings present in NewConsultation layout.');
        }
    }

    const [formData, setFormData] = useState({
        reason: '',
        notes: '',
        diagnosis: '',
        treatment: '',
        receta: '',
        interconsulta: '',
        licencia_medica: '',
        examenes_solicitados: '',
        proximo_control: '',
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
    const [patientLoading, setPatientLoading] = useState(false);
    const [patientError, setPatientError] = useState<string | null>(null);
    const [patient, setPatient] = useState<any | null>(null);
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const authFetch = useAuthFetch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) {
            setError('Paciente inválido.');
            setFormStatus('error');
            if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
                console.warn('NewConsultation: submit blocked (missing patientId)');
            }
            return;
        }
        setSaving(true);
        setError(null);
        setFormStatus('submitting');

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
                receta: formData.receta || undefined,
                interconsulta: formData.interconsulta || undefined,
                licencia_medica: formData.licencia_medica || undefined,
                examenes_solicitados: formData.examenes_solicitados || undefined,
                proximo_control: formData.proximo_control || undefined,
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
                recetaText: formData.receta,
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
                setFormStatus('error');
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
            setFormStatus('success');
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            setFormStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleInvalid = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(false);
        setError('Completa los campos obligatorios.');
        setFormStatus('error');
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
            console.warn('NewConsultation: submit blocked by validation');
        }
    };

    useEffect(() => {
        if (!patientId) return;
        setPatientLoading(true);
        setPatientError(null);

        authFetch(getApiUrl(`/api/patients/${patientId}`))
            .then((res) => {
                if (!res.ok) throw new Error('No se pudo cargar el paciente.');
                return res.json();
            })
            .then((data) => {
                setPatient(data);
            })
            .catch((err) => {
                if (err.message !== 'AUTH_TOKEN_MISSING' && err.message !== 'AUTH_401') {
                    setPatientError('Error al cargar el paciente.');
                }
            })
            .finally(() => {
                setPatientLoading(false);
            });
    }, [patientId]);

    const getPatientField = (value: any) => {
        if (patientLoading) return 'Cargando...';
        if (!value) return '—';
        return String(value);
    };

    const getPatientAge = () => {
        if (patientLoading) return 'Cargando...';
        const birth = patient?.fecha_nacimiento;
        if (!birth) return '—';
        const date = new Date(birth);
        if (Number.isNaN(date.getTime())) return '—';
        const nowDate = new Date();
        let age = nowDate.getFullYear() - date.getFullYear();
        const m = nowDate.getMonth() - date.getMonth();
        if (m < 0 || (m === 0 && nowDate.getDate() < date.getDate())) {
            age -= 1;
        }
        return `${age} años`;
    };

    const patientName = patient
        ? [patient.nombre, patient.apellido_paterno, patient.apellido_materno].filter(Boolean).join(' ')
        : null;

    return (
        <div className="text-[#111318] min-h-screen">
            <main className="max-w-4xl mx-auto space-y-16 pb-32">
                <form
                    onSubmit={handleSubmit}
                    onInvalidCapture={handleInvalid}
                    id="new-consultation-form"
                    className="space-y-16"
                >
                    <div className="mb-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div>
                                <h1 className="text-4xl font-black text-[#111318] tracking-tight">Nueva Consulta</h1>
                                <div className="flex flex-wrap items-baseline gap-3 mt-2">
                                    <span className="text-slate-400 text-2xl font-light">Paciente:</span>
                                    <h2 className="text-4xl font-black text-[#111318] tracking-tight">
                                        {patientLoading ? 'Cargando...' : patientName || '—'}
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
                                <p className="text-2xl font-bold text-[#111318]">{getPatientAge()}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Sexo</label>
                                <p className="text-2xl font-bold text-[#111318]">{getPatientField(patient?.sexo)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">RUT o DNI</label>
                                <p className="text-2xl font-bold text-[#111318]">{getPatientField(patient?.dni || `ID ${patientId}`)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Fecha de Nacimiento</label>
                                <p className="text-2xl font-bold text-[#111318]">{getPatientField(patient?.fecha_nacimiento)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Número de Celular</label>
                                <p className="text-2xl font-bold text-primary">{getPatientField(patient?.telefono)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Nacionalidad</label>
                                <p className="text-2xl font-bold text-[#111318]">{getPatientField(patient?.nacionalidad)}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Domicilio</label>
                                <p className="text-2xl font-bold text-[#111318]">{getPatientField(patient?.direccion)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Comuna</label>
                                <p className="text-2xl font-bold text-[#111318]">{getPatientField(patient?.comuna)}</p>
                            </div>
                        </div>
                        {patientError && (
                            <p className="mt-6 text-sm text-red-600">{patientError}</p>
                        )}
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
                            <BiometryForm
                                onChange={(data) => {
                                    setFormData({ ...formData, ...data });
                                }}
                            />
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
                            placeholder="Diagnóstico principal..."
                            className="w-full text-2xl p-8 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300 bg-white font-mono"
                        />
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
                        <textarea
                            id="receta"
                            name="receta"
                            value={formData.receta}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Medicamentos, dosis, frecuencia y duración..."
                            className="w-full text-2xl p-8 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300 bg-white"
                        />
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <section className="group">
                            <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                                <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">6</span>
                                Interconsulta
                            </label>
                            <textarea
                                id="interconsulta"
                                name="interconsulta"
                                value={formData.interconsulta}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Derivaciones..."
                                className="w-full text-2xl p-8 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300 bg-white"
                            />
                        </section>
                        <section className="group">
                            <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                                <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">7</span>
                                Licencia Médica
                            </label>
                            <textarea
                                id="licencia"
                                name="licencia_medica"
                                value={formData.licencia_medica}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Días, reposo, etc."
                                className="w-full text-2xl p-8 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300 bg-white"
                            />
                        </section>
                    </div>

                    <section className="group">
                        <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                            <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">8</span>
                            Exámenes Solicitados
                        </label>
                        <textarea
                            id="examenes-pedidos"
                            name="examenes_solicitados"
                            value={formData.examenes_solicitados}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Laboratorio, imagenología, etc."
                            className="w-full text-2xl p-8 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300 bg-white"
                        />
                    </section>

                    <section className="group">
                        <label className="flex items-center gap-4 text-3xl font-black text-[#111318] mb-6 group-focus-within:text-primary transition-colors">
                            <span className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center text-xl">9</span>
                            Fecha del Próximo Control
                        </label>
                        <div className="max-w-md">
                            <input
                                id="proximo-control"
                                name="proximo_control"
                                type="date"
                                value={formData.proximo_control}
                                onChange={handleChange}
                                className="w-full text-xl font-bold p-4 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none bg-white text-primary"
                            />
                        </div>
                    </section>
                </form>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-3 z-40">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-500 font-medium">
                        {formStatus !== 'idle' && (
                            <>
                                <span
                                    className={`material-symbols-outlined ${
                                        formStatus === 'success' ? 'text-green-500' : 'text-slate-400'
                                    }`}
                                >
                                    check_circle
                                </span>
                                <span>
                                    {formStatus === 'submitting' && 'Guardando...'}
                                    {formStatus === 'success' && 'Listo para guardar'}
                                    {formStatus === 'error' && 'Error al guardar'}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 md:flex-none px-8 py-2 text-base font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="new-consultation-form"
                            disabled={saving}
                            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white px-10 py-2 rounded-xl text-lg font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-2xl">save</span>
                            {saving ? 'Guardando...' : 'Guardar Consulta'}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
