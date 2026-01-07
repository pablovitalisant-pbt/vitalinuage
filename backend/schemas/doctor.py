from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DoctorProfile(BaseModel):
    id: int
    email: str
    # UI expects fullName, backend model might have full_name property or similar
    # Using alias so JSON output is "fullName"
    full_name: str = Field(..., alias="fullName")
    
    # Optional fields (Flexibilized)
    medical_license: Optional[str] = Field(None, alias="medicalLicense")
    specialty: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = Field(None, alias="profileImage")
    
    # System fields
    role: Optional[str] = None
    is_verified: Optional[bool] = Field(None, alias="isVerified")
    created_at: Optional[datetime] = Field(None, alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True  # Allow populating by alias too
