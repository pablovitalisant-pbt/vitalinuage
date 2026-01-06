from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class DispatchSummaryItem(BaseModel):
    uuid: str
    consultation_id: int
    patient_name: str
    doctor_name: str
    issue_date: datetime
    email_sent_at: Optional[datetime] = None
    whatsapp_sent_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class DispatchAuditResponse(BaseModel):
    items: list[DispatchSummaryItem]
    total_count: int
