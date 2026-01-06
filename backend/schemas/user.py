from pydantic import BaseModel
from typing import Optional

class OnboardingUpdate(BaseModel):
    professional_name: str
    specialty: str
    medical_license: str
    onboarding_completed: bool

    class Config:
        orm_mode = True
