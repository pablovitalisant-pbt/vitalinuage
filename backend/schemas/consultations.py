from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ConsultationBase(BaseModel):
    reason: str
    diagnosis: str
    treatment: Optional[str] = None
    notes: Optional[str] = None

class ConsultationCreate(ConsultationBase):
    peso_kg: Optional[float] = None
    estatura_cm: Optional[float] = None
    imc: Optional[float] = None
    presion_arterial: Optional[str] = None
    frecuencia_cardiaca: Optional[int] = None
    temperatura_c: Optional[float] = None
    alergias: Optional[str] = None
    patologicos: Optional[str] = None
    no_patologicos: Optional[str] = None
    heredofamiliares: Optional[str] = None
    quirurgicos: Optional[str] = None
    medicamentos_actuales: Optional[str] = None

class ConsultationUpdate(ConsultationBase):
    pass

class ConsultationResponse(ConsultationBase):
    id: int
    patient_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    email_sent_at: Optional[datetime] = None
    whatsapp_sent_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
