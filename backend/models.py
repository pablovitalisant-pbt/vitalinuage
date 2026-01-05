from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from database import Base
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
    registration_number = Column(String, nullable=True)
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificación
    nombre = Column(String, index=True, nullable=False)
    apellido_paterno = Column(String, index=True, nullable=False)
    apellido_materno = Column(String, nullable=True)
    dni = Column(String, unique=True, index=True, nullable=False)
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

    # Multitenancy
    owner_id = Column(String, index=True, nullable=False)

    # Relationships
    medical_background = relationship("MedicalBackground", back_populates="patient", uselist=False, cascade="all, delete-orphan")

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

    # Relationships
    patient = relationship("Patient", back_populates="consultations")


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

