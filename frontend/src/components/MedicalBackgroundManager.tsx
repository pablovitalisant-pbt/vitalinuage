import { useEffect, useState } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { MedicalBackground } from '../contracts/MedicalBackground';
import { getApiUrl } from '../config/api';

interface Props {
    patientId: number;
}

export default function MedicalBackgroundManager({ patientId }: Props) {
    const [data, setData] = useState<MedicalBackground | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, [patientId]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/medical-background/pacientes/${patientId}/antecedentes`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 404) {
                // Feature flag off or patient not found (handled by parent usually, but good safeguard)
                setError("Módulo no disponible o paciente no encontrado.");
                setLoading(false);
                return;
            }

            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                setError("Error cargando antecedentes.");
            }
        } catch (err) {
            setError("Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        setSuccess(false);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/medical-background/pacientes/${patientId}/antecedentes`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const updated = await res.json();
                setData(updated);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError("Error al guardar cambios.");
            }
        } catch (err) {
            setError("Error de conexión al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof MedicalBackground, value: string) => {
        if (!data) return;
        setData({ ...data, [field]: value });
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando antecedentes...</div>;

    if (!data && error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;

    // Safety fallback
    if (!data) return <div className="p-8 text-center text-slate-400">No se pudo inicializar formulario.</div>;

    const fields: { key: keyof MedicalBackground, label: string }[] = [
        { key: 'alergias', label: 'Alergias' },
        { key: 'patologicos', label: 'Antecedentes Patológicos' },
        { key: 'no_patologicos', label: 'No Patológicos' },
        { key: 'heredofamiliares', label: 'Heredofamiliares' },
        { key: 'quirurgicos', label: 'Quirúrgicos' },
        { key: 'medicamentos_actuales', label: 'Medicamentos Actuales' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-[#1e3a8a]">Antecedentes Clínicos</h2>
                    <p className="text-sm text-slate-500">Registre la historia médica relevante del paciente.</p>
                </div>
                {success && (
                    <span className="flex items-center text-green-600 text-sm font-medium animate-pulse">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Guardado correctamente
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                        <label htmlFor={key} className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {label}
                        </label>
                        <textarea
                            id={key}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all text-slate-700 min-h-[100px] text-sm leading-relaxed"
                            value={data[key] || ''}
                            onChange={(e) => handleChange(key, e.target.value)}
                            placeholder="Sin datos registrados..."
                        />
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#1e3a8a] text-white px-6 py-2.5 rounded-lg hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed font-medium"
                >
                    {saving ? (
                        <>Guardando...</>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Guardar Antecedentes
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
}
