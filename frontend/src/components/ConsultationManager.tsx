import { useEffect, useState } from 'react';
import { Plus, History, Calendar, Stethoscope, Activity, ClipboardCheck, ArrowRight } from 'lucide-react';
import { ClinicalConsultation, ConsultationForm } from '../contracts/consultations';

interface Props {
    patientId: number;
}

export default function ConsultationManager({ patientId }: Props) {
    const [history, setHistory] = useState<ClinicalConsultation[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState<ConsultationForm>({
        motivo_consulta: '',
        diagnostico: '',
        plan_tratamiento: '',
        examen_fisico: '',
        proxima_cita: ''
    });

    useEffect(() => {
        fetchHistory();
    }, [patientId]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/pacientes/${patientId}/consultas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error("Failed to load consultations", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/pacientes/${patientId}/consultas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                const newConsultation = await res.json();
                setHistory([newConsultation, ...history]);
                setIsCreating(false);
                setForm({ motivo_consulta: '', diagnostico: '', plan_tratamiento: '', examen_fisico: '', proxima_cita: '' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Cargando historial...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Activity className="text-[#1e3a8a] w-5 h-5" />
                    <h2 className="text-lg font-semibold text-[#1e3a8a]">Evolución Clínica</h2>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Consulta
                    </button>
                )}
            </div>

            {isCreating ? (
                <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Motivo de Consulta</label>
                            <input
                                required
                                className="w-full p-2 border border-slate-200 rounded-lg"
                                value={form.motivo_consulta}
                                onChange={e => setForm({ ...form, motivo_consulta: e.target.value })}
                                placeholder="Ej. Dolor abdominal agudo..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Examen Físico</label>
                            <textarea
                                className="w-full p-2 border border-slate-200 rounded-lg h-24"
                                value={form.examen_fisico}
                                onChange={e => setForm({ ...form, examen_fisico: e.target.value })}
                                placeholder="Signos vitales, hallazgos..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Diagnóstico</label>
                            <input
                                required
                                className="w-full p-2 border border-slate-200 rounded-lg"
                                value={form.diagnostico}
                                onChange={e => setForm({ ...form, diagnostico: e.target.value })}
                                placeholder="Ej. Gastritis Aguda"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Próxima Cita (Opcional)</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-slate-200 rounded-lg text-slate-600"
                                value={form.proxima_cita}
                                onChange={e => setForm({ ...form, proxima_cita: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Plan de Tratamiento</label>
                            <textarea
                                required
                                className="w-full p-2 border border-slate-200 rounded-lg h-24"
                                value={form.plan_tratamiento}
                                onChange={e => setForm({ ...form, plan_tratamiento: e.target.value })}
                                placeholder="Receta, indicaciones, reposo..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm disabled:opacity-70"
                        >
                            {submitting ? 'Guardando...' : 'Registrar Consulta'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <div className="py-12 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-400">
                            <Stethoscope className="w-12 h-12 mb-3 opacity-20" />
                            <p>No hay consultas registradas.</p>
                        </div>
                    ) : (
                        history.map(c => (
                            <div key={c.id} className="group border border-slate-100 rounded-lg p-5 hover:shadow-md transition-all bg-white relative">
                                <div className="absolute top-5 right-5 text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Fecha desc.'}
                                </div>

                                <h3 className="text-md font-semibold text-[#1e3a8a] mb-1">{c.motivo_consulta}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                    DX: {c.diagnostico}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                                    <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                        <p className="font-semibold text-xs text-slate-400 mb-1">TRATAMIENTO</p>
                                        {c.plan_tratamiento}
                                    </div>
                                    {c.examen_fisico && (
                                        <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                            <p className="font-semibold text-xs text-slate-400 mb-1">EXAMEN FÍSICO</p>
                                            {c.examen_fisico}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
