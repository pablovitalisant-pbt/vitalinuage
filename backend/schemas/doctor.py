from pydantic import BaseModel

class DoctorProfile(BaseModel):
    professional_name: str
    specialty: str
    registration_number: str
