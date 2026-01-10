
import { BrowserRouter, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import VerifyAccount from './pages/VerifyAccount';
import PublicValidation from './pages/PublicValidation';
import PublicVerification from './pages/PublicVerification';

import PatientProfile from './pages/PatientProfile';
import ProfileSettings from './pages/ProfileSettings';
import RegisterPatient from './pages/RegisterPatient';
import NewConsultation from './pages/NewConsultation';
import TalonarioSettings from './pages/TalonarioSettings';
import AuditPanel from './pages/AuditPanel';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import HomeSearchView from './pages/HomeSearchView';
import { DoctorProvider, useDoctor } from './context/DoctorContext';
import OnboardingView from './pages/OnboardingView';
import OnboardingGuard from './components/auth/OnboardingGuard';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import PatientsPage from './pages/PatientsPage';
import PrintPrescription from './pages/PrintPrescription';
import { ClinicalRecordSchema, ClinicalRecord, ConsultationSchema, ConsultationCreate, ConsultationItem, PrescriptionCreateSchema } from './contracts/patient';
import { getApiUrl } from './config/api';
import { Activity, AlertCircle, ArrowLeft, Droplet, Pill, Plus, X, Calendar, FileText, Trash2 } from 'lucide-react';

const PrescriptionModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: any) => Promise<void> }) => {
    // Dynamic Form State
    const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setMedications([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Handlers (Contract)
    const handleAddMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    };

    const handleRemoveMedication = (index: number) => {
        const newMeds = [...medications];
        newMeds.splice(index, 1);
        setMedications(newMeds);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null); // Clear previous
        try {
            // Contract: Must have at least 1 med. 
            // If empty, Zod inside usePrescriptions will throw.
            // But we should also validate here or rely on hook.
            // Hook uses Zod `min(1)`.
            // We pass { medications }. 
            await onSubmit({ medications });
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <Pill className="mr-2 text-blue-600" size={20} /> Nueva Receta
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-center">
                            <AlertCircle size={16} className="mr-2" /> {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {medications.map((med, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                                <div className="absolute right-2 top-2">
                                    <button
                                        onClick={() => handleRemoveMedication(index)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                        title="Eliminar medicamento"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Medicamento #{index + 1}</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Medicamento</label>
                                        <input
                                            type="text"
                                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                            value={med.name}
                                            onChange={e => {
                                                const newMeds = [...medications];
                                                newMeds[index].name = e.target.value;
                                                setMedications(newMeds);
                                            }}
                                            placeholder="Ej. Amoxicilina"
                                            autoFocus={index === medications.length - 1} // Autofocus on new items
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Dosis</label>
                                        <input
                                            type="text"
                                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                            value={med.dosage}
                                            onChange={e => {
                                                const newMeds = [...medications];
                                                newMeds[index].dosage = e.target.value;
                                                setMedications(newMeds);
                                            }}
                                            placeholder="Ej. 500mg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Frecuencia</label>
                                        <input
                                            type="text"
                                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                            value={med.frequency}
                                            onChange={e => {
                                                const newMeds = [...medications];
                                                newMeds[index].frequency = e.target.value;
                                                setMedications(newMeds);
                                            }}
                                            placeholder="Ej. Cada 8 horas"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Duración</label>
                                        <input
                                            type="text"
                                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                            value={med.duration}
                                            onChange={e => {
                                                const newMeds = [...medications];
                                                newMeds[index].duration = e.target.value;
                                                setMedications(newMeds);
                                            }}
                                            placeholder="Ej. 7 días"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Notas (Opcional)</label>
                                        <input
                                            type="text"
                                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                            value={med.notes || ''}
                                            onChange={e => {
                                                const newMeds = [...medications];
                                                newMeds[index].notes = e.target.value;
                                                setMedications(newMeds);
                                            }}
                                            placeholder="Detalles adicionales..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleAddMedication}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 font-medium text-sm flex items-center transition-colors border border-blue-100"
                        >
                            <Plus size={16} className="mr-1" /> Agregar Medicamento
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 font-medium shadow-sm transition-all flex items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Guardando...
                            </>
                        ) : "Emitir Receta"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Green Phase Implementation
const useClinicalRecord = (id: string) => {
    const [data, setData] = useState<ClinicalRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useDoctor();

    const fetchRecord = async () => {
        if (!id || !token) return;
        setIsLoading(true);
        try {
            const res = await fetch(getApiUrl(`/api/patients/${id}/clinical-record`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Error al obtener ficha clínica");

            const json = await res.json();
            const parsed = ClinicalRecordSchema.parse(json);
            setData(parsed);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("No se pudo cargar la ficha clínica.");
        } finally {
            setIsLoading(false);
        }
    };

    const updateRecord = async (newRecord: ClinicalRecord) => {
        setIsUpdating(true);
        setError(null);
        try {
            // Validate Contract
            const parsedPayload = ClinicalRecordSchema.parse(newRecord);

            const res = await fetch(getApiUrl(`/api/patients/${id}/clinical-record`), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(parsedPayload)
            });

            if (!res.ok) throw new Error("Error al actualizar ficha");

            const json = await res.json();
            const serverParsed = ClinicalRecordSchema.parse(json);
            setData(serverParsed);
            return true;
        } catch (err: any) {
            console.error("Update Error:", err);
            // Handle Zod Errors specifically if needed, or generic
            if (err.errors) {
                setError("Datos inválidos: " + err.errors.map((e: any) => e.message).join(", "));
            } else {
                setError(err.message || "Error al guardar cambios.");
            }
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        fetchRecord();
    }, [id, token]);

    return { data, isLoading, isUpdating, error, updateRecord };
};

// Green Phase: Consultation History Hook
const useConsultationHistory = (patientId: string) => {
    const [history, setHistory] = useState<ConsultationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useDoctor();

    const fetchHistory = async () => {
        if (!patientId || !token) return;
        setIsLoading(true);
        try {
            const res = await fetch(getApiUrl(`/api/patients/${patientId}/consultations`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 404) return; // Patient not found or no access
                throw new Error("Error al cargar historial");
            }

            const json = await res.json();
            // Optional: validate response list
            setHistory(json);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("No se pudo cargar el historial.");
        } finally {
            setIsLoading(false);
        }
    };

    const addConsultation = async (data: any) => {
        try {
            // Validate first
            const parsed = ConsultationSchema.parse(data);

            const res = await fetch(getApiUrl(`/api/patients/${patientId}/consultations`), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(parsed)
            });

            if (!res.ok) throw new Error("Error al guardar consulta");

            return true;
        } catch (err: any) {
            console.error("Add Consultation Error:", err);
            if (err.errors) {
                throw new Error("Datos inválidos: " + err.errors.map((e: any) => e.message).join(", "));
            }
            throw new Error(err.message || "Error al guardar consulta");
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [patientId, token]);

    return { history, isLoading, error, addConsultation, refresh: fetchHistory };
};

// Slice 18.1: Prescription Hook (Contract Phase)
const usePrescriptions = (consultationId?: number) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useDoctor();

    const createPrescription = async (data: any) => {
        if (!consultationId || !token) return;
        setIsLoading(true);
        setError(null);
        try {
            // Validate against schema
            const parsed = PrescriptionCreateSchema.parse({
                consultation_id: consultationId,
                medications: data.medications
            });

            const res = await fetch(getApiUrl(`/api/patients/consultations/${consultationId}/prescription`), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(parsed)
            });

            if (!res.ok) throw new Error("Error al emitir receta");

            return await res.json();
        } catch (err: any) {
            console.error("Prescription Error:", err);
            if (err.errors) {
                throw new Error("Datos inválidos: " + err.errors.map((e: any) => e.message).join(", "));
            }
            throw new Error(err.message || "Error al emitir receta");
        } finally {
            setIsLoading(false);
        }
    };

    return { createPrescription, isLoading, error };
};


const ConsultationTimeline = ({ items, isLoading, error, onEmitPrescription }: { items: ConsultationItem[], isLoading: boolean, error: string | null, onEmitPrescription: (id: number) => void }) => {
    const navigate = useNavigate();

    if (isLoading && items.length === 0) return (
        <div className="py-8 space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-16 bg-slate-200 rounded w-full"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (error) return <div className="p-4 text-center text-red-500 bg-red-50 rounded border border-red-100">{error}</div>;

    return (
        <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {items.length === 0 ? (
                <div className="text-center text-slate-400 py-8 italic relative z-10 bg-white inline-block px-4">No hay consultas registradas</div>
            ) : (
                items.map(item => (
                    <div key={item.id} className="relative flex items-start group">
                        <div className="absolute -left-2.5 mt-1.5 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow sm:border-0 sm:border-transparent"></div>
                        <div className="w-full bg-white ml-6 -mt-1 p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-bold text-slate-800">{item.reason}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                        <Calendar size={12} className="mr-1" />
                                        {new Date(item.date || item.created_at).toLocaleDateString()}
                                    </span>
                                    {/* Prescription Actions (Slice 18.1) */}
                                    {item.prescription_id ? (
                                        <button
                                            onClick={() => navigate(`/print/prescription/${item.prescription_id}`)}
                                            className="text-emerald-600 hover:text-emerald-800 text-xs font-medium flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 transition-colors"
                                        >
                                            <FileText size={12} className="mr-1" /> Receta #{item.prescription_id}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onEmitPrescription(item.id)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 transition-colors hover:bg-blue-100"
                                        >
                                            <Plus size={12} className="mr-1" /> Emitir Receta
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                                {item.diagnosis && (
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="font-semibold text-slate-700 mb-1 flex items-center">
                                            <Activity size={14} className="mr-1 text-slate-500" /> Diagnóstico
                                        </p>
                                        <p className="text-slate-600">{item.diagnosis}</p>
                                    </div>
                                )}
                                {item.treatment && (
                                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                        <p className="font-semibold text-emerald-800 mb-1 flex items-center">
                                            <Pill size={14} className="mr-1" /> Tratamiento
                                        </p>
                                        <p className="text-emerald-700">{item.treatment}</p>
                                    </div>
                                )}
                            </div>

                            {item.notes && (
                                <div className="mt-3 text-sm text-slate-500 italic border-t border-slate-100 pt-2">
                                    "{item.notes}"
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const NewConsultationModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: any) => Promise<void> }) => {
    const [formData, setFormData] = useState({ reason: '', diagnosis: '', treatment: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when opened
    useEffect(() => {
        if (isOpen) {
            setFormData({ reason: '', diagnosis: '', treatment: '', notes: '' });
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await onSubmit(formData);
            onClose(); // Parent handles refresh
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900">Nueva Consulta</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-5">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-center"><AlertCircle size={16} className="mr-2" /> {error}</div>}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo de Consulta <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-sm transition-all"
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Ej. Checkeo anual, Dolor abdominal..."
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnóstico</label>
                            <input
                                type="text"
                                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-sm transition-all"
                                value={formData.diagnosis}
                                onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                                placeholder="Ej. Gastritis aguda"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tratamiento / Indicaciones</label>
                            <textarea
                                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-sm min-h-[80px] transition-all"
                                value={formData.treatment}
                                onChange={e => setFormData({ ...formData, treatment: e.target.value })}
                                placeholder="Ej. Omeprazol 20mg c/24h..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Notas Adicionales (Opcional)</label>
                            <textarea
                                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-sm min-h-[80px] transition-all"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Observaciones privadas..."
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 font-medium shadow-sm transition-all flex items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Guardando...
                            </>
                        ) : "Guardar Consulta"}
                    </button>
                </div>
            </div>
        </div>
    );
};


function App() {
    return (
        <DoctorProvider>
            <BrowserRouter>
                <Toaster position="top-right" />
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/verify" element={<VerifyAccount />} />
                    <Route path="/verify" element={<VerifyAccount />} />
                    <Route path="/v/:uuid" element={<PublicVerification />} />
                    <Route path="/validate-doc/:docToken" element={<PublicValidation />} />

                    {/* Protected Routes */}
                    <Route element={
                        <ProtectedRoute>
                            <OnboardingGuard>
                                <DashboardLayout />
                            </OnboardingGuard>
                        </ProtectedRoute>
                    }>
                        {/* Main Dashboard */}
                        <Route path="/dashboard" element={<HomeSearchView />} />
                        <Route path="/metrics" element={<DashboardPage />} />

                        {/* Feature Routes */}
                        <Route path="/patients" element={<PatientsPage />} />
                        <Route path="/patients/:id" element={<PatientProfile />} />
                        <Route path="/search" element={<HomeSearchView />} />
                        <Route path="/register" element={<RegisterPatient />} />

                        {/* Detail Routes */}
                        <Route path="/patient/:id" element={<PatientProfile />} />
                        <Route path="/patient/:id/new-consultation" element={<NewConsultation />} />

                        {/* Settings & Tools */}
                        <Route path="/settings" element={<ProfileSettings />} />
                        <Route path="/settings/talonario" element={<TalonarioSettings />} />
                        <Route path="/audit" element={<AuditPanel />} />

                        {/* Print Routes */}
                        <Route path="/print/prescription/:id" element={<PrintPrescription />} />

                    </Route>

                    {/* Standalone Onboarding Route - Protected by Logic within Guard */}
                    <Route path="/setup-profile" element={
                        <OnboardingGuard>
                            <OnboardingView />
                        </OnboardingGuard>
                    } />
                    {/* Maintain partial computability with ProtectedRoute redirect */}
                    <Route path="/onboarding" element={<Navigate to="/setup-profile" replace />} />

                </Routes>
            </BrowserRouter>
        </DoctorProvider>
    );
}

export default App;
