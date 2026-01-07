from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class OnboardingUpdate(BaseModel):
    professional_name: str
    specialty: str
    medical_license: str
    onboarding_completed: bool

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    professional_name: str = Field(..., min_length=3)
    specialty: str
    medical_license: str
    registration_number: str

    model_config = ConfigDict(from_attributes=True)
