from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.db_core import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Email Verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True, index=True)
    verification_token_expires_at = Column(DateTime, nullable=True)

    # Doctor Profile
    professional_name = Column(String, nullable=True)
    specialty = Column(String, nullable=True)
    medical_license = Column(String, nullable=True)
    is_onboarded = Column(Boolean, default=False)
    registration_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    signature_image = Column(String, nullable=True)
    print_paper_size = Column(String, nullable=True)
    print_template_id = Column(String, nullable=True)
    print_header_text = Column(String, nullable=True)
    print_footer_text = Column(String, nullable=True)
    print_primary_color = Column(String, nullable=True)
    print_secondary_color = Column(String, nullable=True)
    print_logo_path = Column(String, nullable=True)
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificación
    nombre = Column(String, index=True, nullable=False)
    apellido_paterno = Column(String, index=True, nullable=False)
    apellido_materno = Column(String, nullable=True)
    # Slice 24: Removed global unique=True. Uniqueness is now scoped by owner_id via __table_args__
    dni = Column(String, index=True, nullable=False)
    fecha_nacimiento = Column(String, nullable=False) 
    sexo = Column(String, default="M")

    # Contacto
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    direccion = Column(String, nullable=True)

    # Datos Sociales
    ocupacion = Column(String, nullable=True)
    estado_civil = Column(String, nullable=True)

    # Antropometría
    peso = Column(Float, default=0.0)
    talla = Column(Float, default=0.0)
    imc = Column(Float, default=0.0)
    
    # Extras
    grupo_sanguineo = Column(String, nullable=True)
    alergias = Column(String, nullable=True)
    observaciones = Column(String, nullable=True)

    # Slice 34: Clinical Infrastructure Extensions
    antecedentes_morbidos = Column(String, nullable=True) # Ex: Diabetes, Hypertension

    # Multitenancy
    owner_id = Column(String, index=True, nullable=False)

    # Relationships
    medical_background = relationship("MedicalBackground", back_populates="patient", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('dni', 'owner_id', name='uix_patient_dni_owner'),
    )

class MedicalBackground(Base):
    __tablename__ = "medical_backgrounds"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), unique=True, nullable=False)
    
    patologicos = Column(String, nullable=True)
    no_patologicos = Column(String, nullable=True)
    heredofamiliares = Column(String, nullable=True)
    quirurgicos = Column(String, nullable=True)
    alergias = Column(String, nullable=True)
    medicamentos_actuales = Column(String, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="medical_background")

class ClinicalConsultation(Base):
    __tablename__ = "clinical_consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    
    # Audit & Security
    owner_id = Column(String, index=True, nullable=False) # Copied from Patient for faster filtering or explicit ownership
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Clinical Data
    motivo_consulta = Column(String, nullable=False)
    examen_fisico = Column(String, nullable=True)
    diagnostico = Column(String, nullable=False)
    plan_tratamiento = Column(String, nullable=False)
    proxima_cita = Column(String, nullable=True)

    # Slice 34: Biometrics & Diagnosis
    peso_kg = Column(Float, nullable=True)
    estatura_cm = Column(Float, nullable=True) 
    
    imc = Column(Float, nullable=True)
    presion_arterial = Column(String, nullable=True)
    frecuencia_cardiaca = Column(Integer, nullable=True)
    temperatura_c = Column(Float, nullable=True)
    
    cie10_code = Column(String, nullable=True)
    cie10_description = Column(String, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="consultations")
    verification = relationship("PrescriptionVerification", uselist=False, back_populates="consultation")

    @property
    def email_sent_at(self):
        return self.verification.email_sent_at if self.verification else None

    @property
    def whatsapp_sent_at(self):
        return self.verification.whatsapp_sent_at if self.verification else None


# Add back-populate to Patient
Patient.consultations = relationship("ClinicalConsultation", back_populates="patient", cascade="all, delete-orphan")

class PrescriptionMap(Base):
    __tablename__ = "prescription_maps"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(String, index=True, nullable=False) # Email/ID of the doctor
    
    name = Column(String, nullable=False)
    canvas_width_mm = Column(Float, default=148.0)
    canvas_height_mm = Column(Float, default=210.0)
    
    # Stores List[FieldConfig] as JSON
    fields_config = Column(JSON, nullable=False)
    
    is_active = Column(Boolean, default=True)
    background_image_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class PrescriptionVerification(Base):
    __tablename__ = "prescription_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, nullable=False)
    consultation_id = Column(Integer, ForeignKey("clinical_consultations.id"), nullable=False)
    doctor_email = Column(String, index=True, nullable=False)
    
    # Public data (visible when scanned)
    doctor_name = Column(String, nullable=False)
    issue_date = Column(DateTime, nullable=False)
    email_sent_at = Column(DateTime, nullable=True)
    whatsapp_sent_at = Column(DateTime, nullable=True)
    
    # Audit
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    scanned_count = Column(Integer, default=0)
    last_scanned_at = Column(DateTime, nullable=True)
    
    # Relationships
    consultation = relationship("ClinicalConsultation", back_populates="verification")

class ClinicalRecord(Base):
    """
    New Slice 17.0 Clinical Record (Ficha Clínica).
    Replaces or supplements MedicalBackground.
    """
    __tablename__ = "clinical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), unique=True, nullable=False)
    
    blood_type = Column(String, nullable=True)
    allergies = Column(JSON, default=list)            # List[str]
    chronic_conditions = Column(JSON, default=list)   # List[str]
    family_history = Column(String, nullable=True)
    current_medications = Column(JSON, default=list)  # List[str]
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    patient = relationship("Patient", back_populates="clinical_record")

Patient.clinical_record = relationship("ClinicalRecord", back_populates="patient", uselist=False, cascade="all, delete-orphan")





class Prescription(Base):
    """
    Stub for Prescription model to satisfy doctor.py import.
    Slice 12.2 Polish requirement regarding backend verification.
    """
    __tablename__ = "prescriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
