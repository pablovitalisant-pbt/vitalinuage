import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FilePlus, ArrowLeft, History, User, Printer, Settings, ScrollText, AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { PrintSettingsModal } from '../components/PrintSettingsModal';
import PrescriptionDelivery from '../components/PrescriptionDelivery';
import MedicalBackgroundManager from '../components/MedicalBackgroundManager';
import ConsultationManager from '../components/ConsultationManager';
import VitalSignsCards from '../components/patients/VitalSignsCards';
import { getApiUrl } from '../config/api';

// Simplified interface for view
interface PatientData {
    id: string;
    nombre: string;
    apellido_paterno: string;
    dni: string;
    fecha_nacimiento: string;
    imc: number;
    email?: string;
    blood_type?: string | null;
    allergies?: string[];
    chronic_conditions?: string[];
    current_medications?: string[];
}

import { useDoctor } from '../context/DoctorContext';
// ... imports

export default function PatientProfile() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { profile, token } = useDoctor(); // Consuming context + token for auth
    const [patient, setPatient] = useState<PatientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [consultations, setConsultations] = useState<any[]>([]);

    // Modal State
    const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [showPrintSettings, setShowPrintSettings] = useState(false);
    const [isEditingPatient, setIsEditingPatient] = useState(false);

    // Moved import to top of file
    // import MedicalBackgroundManager from '../components/MedicalBackgroundManager';

    // Smart Back: Navigate to origin or fallback to /search
    const handleBack = () => {
        const from = location.state?.from || '/search';
        navigate(from);
    };

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

    // Tab State
    const [activeTab, setActiveTab] = useState<'consultations' | 'background' | 'recipes'>('consultations');

    useEffect(() => {
        if (!id) return;

        // Prepare auth headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Parallel fetch for Patient and Consultations
        const fetchPatient = fetch(getApiUrl(`/api/patients/${id}`), { headers }).then(res => {
            if (!res.ok) throw new Error("Patient not found");
            return res.json();
        });

        const fetchConsultations = fetch(getApiUrl(`/api/patients/${id}/consultations`), { headers }).then(res => {
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
        <div className="min-h-screen bg-slate-50 font-sans px-8 pt-28 relative">
            <div className={`max-w-4xl mx-auto space-y-6 ${selectedConsultation || showPrintSettings ? 'blur-sm brightness-50 pointer-events-none' : ''} transition-all duration-300`}>

                {/* Back Navigation */}
                <button
                    onClick={handleBack}
                    className="flex items-center text-slate-500 hover:text-[#1e3a8a] transition-colors mb-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver a búsqueda
                </button>

                {/* Elegant Minimal Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex gap-3 items-baseline mb-2">
                            <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900">
                                {patient.nombre} {patient.apellido_paterno}
                            </h1>
                            {isEditingPatient && (
                                <span className="text-xs text-blue-600 font-semibold">Editando</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
                            <span>DNI: {patient.dni}</span>
                            <span>•</span>
                            <span>{age} años</span>
                            <span>•</span>
                            <span>{patient.email || 'Sin email'}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditingPatient(!isEditingPatient)}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Editar Paciente"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setShowPrintSettings(true)}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Configuración de Impresión"
                        >
                            <Printer className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Allergy Alert Banner - PRIORITY #1 */}
                {patient.allergies && patient.allergies.length > 0 ? (
                    <div
                        className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-6 mb-8 rounded-3xl shadow-lg flex items-start gap-4 animate-pulse-slow"
                        data-testid="allergy-alert-banner"
                    >
                        <div className="p-3 bg-red-100 rounded-2xl">
                            <AlertTriangle className="h-6 w-6 text-red-600" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-red-900 font-black text-base mb-2 uppercase tracking-wide flex items-center gap-2">
                                <span className="text-2xl">⚠️</span>
                                ALERGIAS REGISTRADAS
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {patient.allergies.map((allergy, idx) => (
                                    <span
                                        key={idx}
                                        className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-bold border-2 border-red-200"
                                    >
                                        {allergy}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 p-4 mb-8 rounded-2xl text-center">
                        <p className="text-slate-500 text-sm font-semibold">✓ Sin alergias registradas</p>
                    </div>
                )}

                {/* Vital Signs Snapshot - Connected to Real Data */}
                <VitalSignsCards
                    imc={(() => {
                        if (patient.imc) return patient.imc;
                        const lastConsult = consultations[0];
                        if (lastConsult?.peso_kg && lastConsult?.estatura_cm) {
                            const heightInMeters = lastConsult.estatura_cm / 100;
                            return lastConsult.peso_kg / (heightInMeters * heightInMeters);
                        }
                        return undefined;
                    })()}
                    bloodPressure={consultations[0]?.presion_arterial}
                    weight={consultations[0]?.peso_kg}
                    height={consultations[0]?.estatura_cm}
                    lastConsultationDate={consultations[0]?.created_at}
                />



            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 gap-6">
                <button
                    onClick={() => setActiveTab('consultations')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'consultations' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Consultas & Historial
                </button>
                <button
                    onClick={() => setActiveTab('background')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'background' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Antecedentes
                </button>
                <button
                    onClick={() => setActiveTab('recipes')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'recipes' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Recetas
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'consultations' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                        {/* Evolution / History - REPLACED OLD HISTORY */}
                        <div className="md:col-span-2">
                            <ConsultationManager patientId={parseInt(id || "0")} />
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Acciones Rápidas</h2>
                            <div className="space-y-3">


                                {/* ... imports */}

                                {/* ... inside component ... */}

                                <button
                                    onClick={() => navigate(`/patient/${id}/new-consultation`)}
                                    className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                    <FilePlus className="h-5 w-5" />
                                    Nueva Consulta
                                </button>
                                <button
                                    onClick={() => setIsEditingPatient(!isEditingPatient)}
                                    className={`w-full flex items-center justify-center gap-2 border hover:bg-slate-50 font-medium py-3 px-4 rounded-lg transition-colors ${isEditingPatient ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                                >
                                    {isEditingPatient ? 'Cancelar Edición' : 'Editar Datos'}
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'background' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <MedicalBackgroundManager patientId={parseInt(id || "0")} />
                    </div>
                )}

                {activeTab === 'recipes' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 bg-white p-12 rounded-xl text-center border border-slate-100 shadow-sm">
                        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FilePlus className="h-8 w-8 text-[#1e3a8a]" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Gestión de Recetas</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6">
                            Módulo de gestión de recetas electrónicas activado. Aquí podrá visualizar y generar nuevas recetas para el paciente.
                        </p>
                        <button
                            onClick={() => navigate(`/patient/${id}/new-prescription`)}
                            className="inline-flex items-center gap-2 bg-[#1e3a8a] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-900 transition-colors shadow-md"
                        >
                            <ScrollText className="h-5 w-5" />
                            + Nueva Receta / Licencia
                        </button>
                    </div>
                )}
            </div>

            {/* Print Settings Modal */}
            {
                showPrintSettings && (
                    <PrintSettingsModal onClose={() => setShowPrintSettings(false)} />
                )
            }

            {/* Detail/Edit Modal */}
            {
                selectedConsultation && (
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
                )
            }
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
