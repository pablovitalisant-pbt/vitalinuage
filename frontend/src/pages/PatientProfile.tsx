import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FilePlus, ArrowLeft, Printer, Settings, ScrollText, AlertTriangle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { PrintSettingsModal } from '../components/PrintSettingsModal';
import PrescriptionDelivery from '../components/PrescriptionDelivery';
import MedicalBackgroundManager from '../components/MedicalBackgroundManager';
import ConsultationManager from '../components/ConsultationManager';
import VitalSignsCards from '../components/patients/VitalSignsCards';
import { getApiUrl } from '../config/api';

import { useDoctor } from '../context/DoctorContext';
import { useAuthFetch } from '../hooks/useAuthFetch';

// Simplified interface for view
interface PatientData {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  dni: string;
  fecha_nacimiento: string;
  sexo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ocupacion?: string | null;
  estado_civil?: string | null;
  peso?: number | null;
  talla?: number | null;
  imc?: number | null;
  grupo_sanguineo?: string | null;
  alergias?: string | null;
  observaciones?: string | null;
  email?: string | null;
}

interface PatientFormData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  dni: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono: string;
  email: string;
  direccion: string;
  ocupacion: string;
  estado_civil: string;
  peso: string;
  talla: string;
  imc: string;
  grupo_sanguineo: string;
  alergias: string;
  observaciones: string;
}

interface MedicalBackgroundData {
  alergias?: string | null;
}

export default function PatientProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { profile } = useDoctor(); // Consuming context (kept)
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [medicalBackground, setMedicalBackground] = useState<MedicalBackgroundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<any[]>([]);

  // Modal State
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [patientForm, setPatientForm] = useState<PatientFormData | null>(null);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [patientSaveError, setPatientSaveError] = useState<string | null>(null);
  const [patientSaveSuccess, setPatientSaveSuccess] = useState(false);

  // Smart Back: Navigate to origin or fallback to /search
  const handleBack = () => {
    const from = (location.state as any)?.from || '/search';
    navigate(from);
  };

  const authFetch = useAuthFetch(); // ✅ Use centralized auth hook

  const handleSave = async () => {
    if (!selectedConsultation || !editForm) return;

    try {
      const res = await authFetch(`/api/consultations/${selectedConsultation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updated = await res.json();

        setConsultations((prev) =>
          prev.map((c) =>
            c.id === selectedConsultation.id
              ? {
                  ...c,
                  reason: updated.reason || c.reason,
                  diagnosis: updated.diagnosis || c.diagnosis,
                  treatment: updated.treatment || c.treatment,
                }
              : c
          )
        );

        setIsEditing(false);
        setSelectedConsultation(null); // Close modal
      }
    } catch (err) {
      console.error('Failed to update consultation', err);
    }
  };

  useEffect(() => {
    if (!isEditingPatient || !patient) return;

    setPatientForm({
      nombre: patient.nombre || '',
      apellido_paterno: patient.apellido_paterno || '',
      apellido_materno: patient.apellido_materno || '',
      dni: patient.dni || '',
      fecha_nacimiento: patient.fecha_nacimiento || '',
      sexo: patient.sexo || 'M',
      telefono: patient.telefono || '',
      email: patient.email || '',
      direccion: patient.direccion || '',
      ocupacion: patient.ocupacion || '',
      estado_civil: patient.estado_civil || '',
      peso: patient.peso !== null && patient.peso !== undefined ? String(patient.peso) : '',
      talla: patient.talla !== null && patient.talla !== undefined ? String(patient.talla) : '',
      imc: patient.imc !== null && patient.imc !== undefined ? String(patient.imc) : '',
      grupo_sanguineo: patient.grupo_sanguineo || '',
      alergias: patient.alergias || '',
      observaciones: patient.observaciones || ''
    });
  }, [isEditingPatient, patient]);

  const handlePatientChange = (field: keyof PatientFormData, value: string) => {
    setPatientForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handlePatientSave = async () => {
    if (!patientForm || !id) return;
    setIsSavingPatient(true);
    setPatientSaveError(null);
    setPatientSaveSuccess(false);

    const toNumber = (value: string) => {
      if (!value) return null;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const payload = {
      nombre: patientForm.nombre.trim(),
      apellido_paterno: patientForm.apellido_paterno.trim(),
      apellido_materno: patientForm.apellido_materno.trim() || null,
      dni: patientForm.dni.trim(),
      fecha_nacimiento: patientForm.fecha_nacimiento,
      sexo: patientForm.sexo,
      telefono: patientForm.telefono.trim() || null,
      email: patientForm.email.trim() || null,
      direccion: patientForm.direccion.trim() || null,
      ocupacion: patientForm.ocupacion.trim() || null,
      estado_civil: patientForm.estado_civil.trim() || null,
      peso: toNumber(patientForm.peso),
      talla: toNumber(patientForm.talla),
      imc: toNumber(patientForm.imc),
      grupo_sanguineo: patientForm.grupo_sanguineo.trim() || null,
      alergias: patientForm.alergias.trim() || null,
      observaciones: patientForm.observaciones.trim() || null
    };

    try {
      const res = await authFetch(getApiUrl(`/api/patients/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        setPatientSaveError(errorBody.detail || 'No se pudo guardar el paciente.');
        return;
      }

      const updated = await res.json();
      setPatient(updated);
      setPatientSaveSuccess(true);
      setIsEditingPatient(false);
    } catch (error) {
      console.error('Error updating patient', error);
      setPatientSaveError('Error de conexión al guardar el paciente.');
    } finally {
      setIsSavingPatient(false);
    }
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<'consultations' | 'background' | 'recipes'>('consultations');

  useEffect(() => {
    if (!id) return;

    const fetchPatient = authFetch(getApiUrl(`/api/patients/${id}`)).then((res) => {
      if (!res.ok) throw new Error('Patient not found');
      return res.json();
    });

    const fetchConsultations = authFetch(getApiUrl(`/api/patients/${id}/consultations`)).then((res) => {
      if (res.ok) return res.json();
      return [];
    });

    // ✅ Source of truth for allergies banner
    const fetchMedicalBackground = authFetch(getApiUrl(`/api/medical-background/pacientes/${id}/antecedentes`))
      .then((res) => {
        if (res.ok) return res.json();
        return null; // 404 or others => treat as "no data"
      })
      .catch(() => null);

    Promise.all([fetchPatient, fetchConsultations, fetchMedicalBackground])
      .then(([patientData, consultationsData, medicalBackgroundData]) => {
        setPatient(patientData);
        setConsultations(consultationsData);
        setMedicalBackground(medicalBackgroundData);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message !== 'AUTH_TOKEN_MISSING' && err.message !== 'AUTH_401') {
          console.error(err);
        }
        setLoading(false);
      });
  }, [id]);

  const allergiesList = useMemo(() => {
    const txt = (medicalBackground?.alergias ?? '').trim();
    if (!txt) return [];
    return txt
      .split(/[\n,;]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [medicalBackground]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Cargando ficha...</div>;
  }

  if (!patient) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Paciente no encontrado</div>;
  }

  // Calculated fields
  const fullName = [patient.nombre, patient.apellido_paterno, patient.apellido_materno].filter(Boolean).join(' ');
  const age = new Date().getFullYear() - new Date(patient.fecha_nacimiento).getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 font-sans px-8 pt-28 relative">
      <div
        className={`max-w-4xl mx-auto space-y-6 ${
          selectedConsultation || showPrintSettings ? 'blur-sm brightness-50 pointer-events-none' : ''
        } transition-all duration-300`}
      >
        {/* Back Navigation */}
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-[#1e3a8a] transition-colors mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a búsqueda
        </button>

        {/* Elegant Minimal Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex gap-3 items-baseline mb-2">
              <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900">{fullName}</h1>
              {isEditingPatient && <span className="text-xs text-blue-600 font-semibold">Editando</span>}
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

        {isEditingPatient && patientForm && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Editar datos del paciente</h2>
                <p className="text-sm text-slate-500">Actualiza la informacion principal del paciente.</p>
              </div>
              {patientSaveSuccess && (
                <span className="text-sm text-emerald-600 font-semibold">✓ Guardado</span>
              )}
            </div>

            {patientSaveError && (
              <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {patientSaveError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nombre</label>
                <input
                  value={patientForm.nombre}
                  onChange={(e) => handlePatientChange('nombre', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Apellido paterno</label>
                <input
                  value={patientForm.apellido_paterno}
                  onChange={(e) => handlePatientChange('apellido_paterno', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Apellido materno</label>
                <input
                  value={patientForm.apellido_materno}
                  onChange={(e) => handlePatientChange('apellido_materno', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">DNI</label>
                <input
                  value={patientForm.dni}
                  onChange={(e) => handlePatientChange('dni', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={patientForm.fecha_nacimiento}
                  onChange={(e) => handlePatientChange('fecha_nacimiento', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Sexo</label>
                <select
                  value={patientForm.sexo}
                  onChange={(e) => handlePatientChange('sexo', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none bg-white"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Telefono</label>
                <input
                  value={patientForm.telefono}
                  onChange={(e) => handlePatientChange('telefono', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={patientForm.email}
                  onChange={(e) => handlePatientChange('email', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Direccion</label>
                <input
                  value={patientForm.direccion}
                  onChange={(e) => handlePatientChange('direccion', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Ocupacion</label>
                <input
                  value={patientForm.ocupacion}
                  onChange={(e) => handlePatientChange('ocupacion', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Estado civil</label>
                <input
                  value={patientForm.estado_civil}
                  onChange={(e) => handlePatientChange('estado_civil', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patientForm.peso}
                  onChange={(e) => handlePatientChange('peso', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Talla (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patientForm.talla}
                  onChange={(e) => handlePatientChange('talla', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">IMC</label>
                <input
                  type="number"
                  step="0.1"
                  value={patientForm.imc}
                  onChange={(e) => handlePatientChange('imc', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Grupo sanguineo</label>
                <input
                  value={patientForm.grupo_sanguineo}
                  onChange={(e) => handlePatientChange('grupo_sanguineo', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Alergias</label>
                <textarea
                  rows={2}
                  value={patientForm.alergias}
                  onChange={(e) => handlePatientChange('alergias', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Observaciones</label>
                <textarea
                  rows={3}
                  value={patientForm.observaciones}
                  onChange={(e) => handlePatientChange('observaciones', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditingPatient(false);
                  setPatientSaveError(null);
                }}
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handlePatientSave}
                disabled={isSavingPatient}
                className="px-5 py-2.5 bg-[#1e3a8a] text-white rounded-lg font-medium hover:bg-blue-900 transition-colors disabled:opacity-60"
              >
                {isSavingPatient ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}

        {/* Allergy Alert Banner - PRIORITY #1 */}
        {allergiesList.length > 0 ? (
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
                {allergiesList.map((allergy, idx) => (
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
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'consultations'
              ? 'border-[#1e3a8a] text-[#1e3a8a]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Consultas & Historial
        </button>
        <button
          onClick={() => setActiveTab('background')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'background' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Antecedentes
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'recipes' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Recetas
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'consultations' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <div className="md:col-span-2">
              <ConsultationManager patientId={parseInt(id || '0')} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/patient/${id}/new-consultation`)}
                  className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <FilePlus className="h-5 w-5" />
                  Nueva Consulta
                </button>
                <button
                  onClick={() => setIsEditingPatient(!isEditingPatient)}
                  className={`w-full flex items-center justify-center gap-2 border hover:bg-slate-50 font-medium py-3 px-4 rounded-lg transition-colors ${
                    isEditingPatient ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {isEditingPatient ? 'Cancelar Edición' : 'Editar Datos'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'background' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <MedicalBackgroundManager patientId={parseInt(id || '0')} />
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
      {showPrintSettings && <PrintSettingsModal onClose={() => setShowPrintSettings(false)} />}

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
  const authFetch = useAuthFetch(); // ✅ Use centralized auth hook in sub-component
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!editForm) {
      authFetch(`/api/consultations/${consultation.id}`)
        .then((res) => res.json())
        .then((data) => {
          setEditForm(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [consultation.id, editForm]);

  const handlePrint = () => {
    window.open(`/api/print/consultation/${consultation.id}`, '_blank');
  };

  if (loading && !editForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#1e3a8a]">{isEditing ? 'Editar Consulta' : 'Detalle de Consulta'}</h3>
            <p className="text-sm text-slate-500">
              {new Date(consultation.date).toLocaleDateString()} • {consultation.doctor}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handlePrint}
                className="p-2 text-slate-400 hover:text-[#1e3a8a] hover:bg-slate-100 rounded-full transition-colors"
                title="Imprimir Receta"
              >
                <Printer className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
              ✕
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {isEditing ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Motivo de Consulta</label>
                <input
                  className="w-full p-2 border border-slate-200 rounded font-medium text-slate-800"
                  value={editForm.reason || ''}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Diagnóstico</label>
                  <input
                    className="w-full p-2 border border-slate-200 rounded text-slate-800"
                    value={editForm.diagnosis || ''}
                    onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tratamiento</label>
                  <textarea
                    className="w-full p-2 border border-slate-200 rounded text-slate-800"
                    value={editForm.treatment || ''}
                    onChange={(e) => setEditForm({ ...editForm, treatment: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">Notas Clínicas</label>
                <textarea
                  className="w-full p-2 border border-yellow-200 bg-yellow-50 rounded text-slate-700 h-24"
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
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

              <PrescriptionDelivery consultationId={consultation.id} patientEmail={patientEmail} />
            </>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm transition-colors">
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
