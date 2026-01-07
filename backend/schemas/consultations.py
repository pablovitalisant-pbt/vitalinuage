from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ConsultationBase(BaseModel):
    reason: str
    diagnosis: str
    treatment: Optional[str] = None
    notes: Optional[str] = None

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

    model_config = ConfigDict(from_attributes=True)
