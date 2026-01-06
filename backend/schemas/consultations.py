from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConsultationBase(BaseModel):
    motivo_consulta: str
    examen_fisico: Optional[str] = None
    diagnostico: str
    plan_tratamiento: str
    proxima_cita: Optional[str] = None  # Flexible format or ISO date string

class ConsultationCreate(ConsultationBase):
    pass

class ConsultationUpdate(ConsultationBase):
    pass

class ConsultationResponse(ConsultationBase):
    id: int
    patient_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    email_sent_at: Optional[datetime] = None
    whatsapp_sent_at: Optional[datetime] = None
    email_sent_at: Optional[datetime] = None
    whatsapp_sent_at: Optional[datetime] = None
    email_sent_at: Optional[datetime] = None
    whatsapp_sent_at: Optional[datetime] = None
    email_sent_at: Optional[datetime] = None
    whatsapp_sent_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True




