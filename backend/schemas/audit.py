from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum

class DispatchSummaryItem(BaseModel):
    uuid: str
    consultation_id: int
    patient_name: str
    doctor_name: str
    issue_date: datetime
    email_sent_at: Optional[datetime]
    whatsapp_sent_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class DispatchAuditResponse(BaseModel):
    items: List[DispatchSummaryItem]
    total_count: int

class DispatchStatus(str, Enum):
    ALL = "all"
    PENDING = "pending"
    SENT = "sent"

class DispatchAuditFilterParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[DispatchStatus] = DispatchStatus.ALL
