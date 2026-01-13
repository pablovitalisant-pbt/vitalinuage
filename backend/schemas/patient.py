from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
import html
import re

# Security Util (Inline for now or moved to utils/security later)
def sanitize_text(value: str) -> str:
    if not value: return value
    # 1. Remove script tags and their content efficiently
    # allow dot to match newlines
    clean_text = re.sub(r'<script[\s\S]*?>[\s\S]*?</script>', '', value, flags=re.IGNORECASE)
    # 2. Remove other HTML tags
    clean_text = re.sub(r'<[^>]*>', '', clean_text)
    return clean_text.strip()

class PatientItem(BaseModel):
    id: int
    full_name: str
    id_number: str
    last_consultation: Optional[datetime] = None
    status: str

    model_config = ConfigDict(from_attributes=True)

class PatientListResponse(BaseModel):
    data: List[PatientItem]
    total: int
    page: int
    size: int
    
    model_config = ConfigDict(from_attributes=True)

class ClinicalRecord(BaseModel):
    blood_type: Optional[str] = None
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    family_history: Optional[str] = None
    current_medications: List[str] = []
    
    model_config = ConfigDict(from_attributes=True)

    @field_validator('allergies', 'chronic_conditions', 'current_medications', mode='before')
    @classmethod
    def sanitize_list(cls, v: List[str]) -> List[str]:
        if not v: return []
        return [sanitize_text(item) for item in v if item]

    @field_validator('family_history', 'blood_type', mode='before')
    @classmethod
    def sanitize_optional_str(cls, v: Optional[str]) -> Optional[str]:
        if not v: return None
        return sanitize_text(v)

class ConsultationBase(BaseModel):
    reason: str
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('reason', mode='before')
    @classmethod
    def sanitize_reason(cls, v: str) -> str:
        return sanitize_text(v)

    @field_validator('diagnosis', 'treatment', 'notes', mode='before')
    @classmethod
    def sanitize_fields(cls, v: Optional[str]) -> Optional[str]:
        if not v: return None
        return sanitize_text(v)

class ConsultationCreate(ConsultationBase):
    pass

class ConsultationItem(ConsultationBase):
    id: int
    date: datetime
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# New Spanish Schema for Frontend Display (SP-02)
class ConsultationItemSpanish(BaseModel):
    id: int
    motivo_consulta: str
    diagnostico: str
    plan_tratamiento: str
    examen_fisico: Optional[str] = None
    created_at: datetime
    
    # Biometric fields (Slice 34/35)
    peso_kg: Optional[float] = None
    estatura_cm: Optional[float] = None
    imc: Optional[float] = None
    presion_arterial: Optional[str] = None
    frecuencia_cardiaca: Optional[int] = None
    temperatura_c: Optional[float] = None
    
    # CIE-10 Diagnosis
    cie10_code: Optional[str] = None
    cie10_description: Optional[str] = None
    
    # Optional fields for tracking
    email_sent_at: Optional[datetime] = None
    whatsapp_sent_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str] = None

class PrescriptionCreate(BaseModel):
    consultation_id: int
    medications: List[MedicationItem]

class PrescriptionResponse(BaseModel):
    id: int
    date: datetime
    doctor_name: str
    patient_name: str
    medications: List[MedicationItem]
    
    model_config = ConfigDict(from_attributes=True)
