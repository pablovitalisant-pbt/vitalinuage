import { useNavigate, useParams } from 'react-router-dom';
import { FilePlus, ArrowLeft, History, User, Printer, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PrintSettingsModal } from '../components/PrintSettingsModal';
import PrescriptionDelivery from '../components/PrescriptionDelivery';

// Simplified interface for view
interface PatientData {
    id: string;
    nombre: string;
    apellido_paterno: string;
    dni: string;
    fecha_nacimiento: string;
    imc: number;
    email?: string;
}

import { useDoctor } from '../context/DoctorContext';
// ... imports

export default function PatientProfile() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profile } = useDoctor(); // Consuming context
    const [patient, setPatient] = useState<PatientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [consultations, setConsultations] = useState<any[]>([]);

    // Modal State
    const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [showPrintSettings, setShowPrintSettings] = useState(false);

    const handleSave = async () => {
        if (!selectedConsultation || !editForm) return;

        try {
            const res = await fetch(`/api/consultations/${selectedConsultation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                // Update local list optimistically or refetch
                const updated = await res.json();

                setConsultations(prev => prev.map(c =>
                    c.id === selectedConsultation.id
                        ? { ...c, reason: updated.reason || c.reason, diagnosis: updated.diagnosis || c.diagnosis, treatment: updated.treatment || c.treatment }
                        : c
                ));

                setIsEditing(false);
                setSelectedConsultation(null); // Close modal
            }
        } catch (err) {
            console.error("Failed to update consultation", err);
        }
    };

    useEffect(() => {
        if (!id) return;

        // Parallel fetch for Patient and Consultations
        const fetchPatient = fetch(`/api/pacientes/${id}`).then(res => {
            if (!res.ok) throw new Error("Patient not found");
            return res.json();
        });

        const fetchConsultations = fetch(`/api/patients/${id}/consultations`).then(res => {
            if (res.ok) return res.json();
            return [];
        });

        Promise.all([fetchPatient, fetchConsultations])
            .then(([patientData, consultationsData]) => {
                setPatient(patientData);
                setConsultations(consultationsData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Cargando ficha...</div>;
    }

    if (!patient) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Paciente no encontrado</div>;
    }

    // Calculated fields
    const fullName = `${patient.nombre} ${patient.apellido_paterno}`;
    const age = new Date().getFullYear() - new Date(patient.fecha_nacimiento).getFullYear();

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 pt-24 relative">
            <div className={`max-w-4xl mx-auto space-y-6 ${selectedConsultation || showPrintSettings ? 'blur-sm brightness-50 pointer-events-none' : ''} transition-all duration-300`}>

                {/* Back Navigation */}
                <button
                    onClick={() => navigate('/search')}
                    className="flex items-center text-slate-500 hover:text-[#1e3a8a] transition-colors mb-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver a búsqueda
                </button>

                {/* Header Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-50 p-3 rounded-full">
                            <User className="h-8 w-8 text-[#1e3a8a]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#1e3a8a]">{fullName}</h1>
                            <div className="flex items-center gap-4 text-slate-500 mt-1 text-sm">
                                <span>DNI: {patient.dni}</span>
                                <span>•</span>
                                <span>{age} años</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${patient.imc > 25 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    IMC: {patient.imc.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPrintSettings(true)}
                        className="p-2 text-slate-400 hover:text-[#1e3a8a] transition-colors"
                        title="Configuración de Impresión"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Timeline / History */}
                    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <History className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-800">Historial de Consultas</h2>
                        </div>

                        {consultations.length === 0 ? (
                            <div className="text-slate-400 text-sm italic p-4 text-center bg-slate-50 rounded-lg">
                                No hay consultas registradas.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {consultations.map((cons) => (
                                    <div
                                        key={cons.id}
                                        onClick={() => {
                                            setSelectedConsultation(cons);
                                            setIsEditing(false);
                                            setEditForm(null); // Will load in Modal
                                        }}
                                        className="bg-slate-50 rounded-lg p-4 border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-sm font-semibold text-[#1e3a8a] group-hover:text-blue-700">{new Date(cons.date).toLocaleDateString()}</p>
                                            <span className="text-xs text-slate-400 group-hover:text-blue-400">Ver detalle &rarr;</span>
                                        </div>
                                        <p className="font-medium text-slate-800 mb-1">{cons.reason}</p>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Diagnóstico: {cons.diagnosis}</p>
                                        <div className="text-sm text-slate-600 mt-2 bg-white p-2 rounded border border-slate-100 text-ellipsis overflow-hidden whitespace-nowrap">
                                            {cons.treatment}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Acciones Rápidas</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate(`/patient/${id}/new-consultation`)}
                                className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                                <FilePlus className="h-5 w-5" />
                                Nueva Consulta
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors">
                                Editar Datos
                            </button>
                        </div>
                    </div>

                </div>

            </div>

            {/* Print Settings Modal */}
            {showPrintSettings && (
                <PrintSettingsModal onClose={() => setShowPrintSettings(false)} />
            )}

            {/* Detail/Edit Modal */}
            {selectedConsultation && (
                <ConsultationModal
                    consultation={selectedConsultation}
                    isEditing={isEditing}
                    onClose={() => setSelectedConsultation(null)}
                    onEdit={() => setIsEditing(true)}
                    onSave={handleSave}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    patientEmail={patient.email}
                />
            )}
        </div>
    );
}

// Sub-component for Modal Logic to keep main clean
function ConsultationModal({ consultation, isEditing, onClose, onEdit, onSave, editForm, setEditForm, patientEmail }: any) {
    const [loading, setLoading] = useState(true);
    // If not editing, display details. If editing, display form. 
    // We need to fetch details for both cases initially to populate fields.

    useEffect(() => {
        if (!editForm) {
            fetch(`/api/consultations/${consultation.id}`)
                .then(res => res.json())
                .then(data => {
                    setEditForm(data); // Populate form with existing data including notes
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [consultation.id, editForm]); // Added editForm to dependency array to prevent re-fetching if editForm is already set

    const handlePrint = () => {
        // Placeholder for future PDF generation
        // Requirement says: "call endpoint of PDF generation and open in new tab"
        // Since URL is not yet defined, we'll placeholder it to window.print() or open a new tab
        // For now, let's open a new tab to a print view (which we might mock)
        window.open(`/api/print/consultation/${consultation.id}`, '_blank');
    };

    if (loading && !editForm) return null; // Or loader inside modal wrapper

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-[#1e3a8a]">{isEditing ? 'Editar Consulta' : 'Detalle de Consulta'}</h3>
                        <p className="text-sm text-slate-500">{new Date(consultation.date).toLocaleDateString()} • {consultation.doctor}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                        {!isEditing && (
                            <button
                                onClick={handlePrint}
                                className="p-2 text-slate-400 hover:text-[#1e3a8a] hover:bg-slate-100 rounded-full transition-colors"
                                title="Imprimir Receta"
                            >
                                <Printer className="h-5 w-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {isEditing ? (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Motivo de Consulta</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded font-medium text-slate-800"
                                    value={editForm.reason || ''}
                                    onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Diagnóstico</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded text-slate-800"
                                        value={editForm.diagnosis || ''}
                                        onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tratamiento</label>
                                    <textarea
                                        className="w-full p-2 border border-slate-200 rounded text-slate-800"
                                        value={editForm.treatment || ''}
                                        onChange={e => setEditForm({ ...editForm, treatment: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">Notas Clínicas</label>
                                <textarea
                                    className="w-full p-2 border border-yellow-200 bg-yellow-50 rounded text-slate-700 h-24"
                                    value={editForm.notes || ''}
                                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Motivo de Consulta</label>
                                <p className="text-lg text-slate-800 font-medium">{editForm?.reason}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Diagnóstico</label>
                                    <p className="text-slate-800">{editForm?.diagnosis}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tratamiento</label>
                                    <p className="text-slate-800">{editForm?.treatment}</p>
                                </div>
                            </div>
                            {editForm?.notes && (
                                <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                    <label className="block text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">Notas Clínicas</label>
                                    <p className="text-slate-700 whitespace-pre-wrap">{editForm.notes}</p>
                                </div>
                            )}

                            {/* Multichannel Delivery Section */}
                            <PrescriptionDelivery
                                consultationId={consultation.id}
                                patientEmail={patientEmail}
                            />
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm transition-colors"
                    >
                        Cerrar
                    </button>
                    {isEditing ? (
                        <button
                            onClick={onSave}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm shadow-sm transition-colors"
                        >
                            Guardar Cambios
                        </button>
                    ) : (
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-900 font-medium text-sm shadow-sm transition-colors"
                        >
                            Editar Consulta
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
