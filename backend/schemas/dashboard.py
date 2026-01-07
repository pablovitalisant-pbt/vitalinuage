from pydantic import BaseModel, ConfigDict
from typing import List
from datetime import datetime

class ActivityItem(BaseModel):
    patient_name: str
    action: str  # e.g., "Consulta", "Receta", "Registro"
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    total_patients: int
    appointments_today: int
    pending_tasks: int = 0
    
    # Slice 20.0: Analytics
    total_prescriptions: int = 0
    weekly_patient_flow: List[int] = [] # Last 7 days
    efficiency_rate: float = 0.0 # Consultations vs Prescriptions
    
    recent_activity: List[ActivityItem] = []

    model_config = ConfigDict(from_attributes=True)
