from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DoctorProfile(BaseModel):
    id: int
    email: str
    # UI expects fullName, backend model might have full_name property or similar
    # Using alias so JSON output is "fullName"
    # Updated to match DB model and Frontend expectations
    professional_name: Optional[str] = Field(None, alias="professionalName")
    
    # Optional fields (Flexibilized)
    medical_license: Optional[str] = Field(None, alias="medicalLicense")
    specialty: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = Field(None, alias="profileImage")
    signature_image: Optional[str] = Field(None, alias="signatureImage")
    
    # System fields
    role: Optional[str] = None
    is_verified: Optional[bool] = Field(None, alias="isVerified")
    is_onboarded: Optional[bool] = Field(None, alias="isOnboarded")
    registration_number: Optional[str] = Field(None, alias="registrationNumber")
    created_at: Optional[datetime] = Field(None, alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True  # Allow populating by alias too

class DoctorPreferencesUpdate(BaseModel):
    paper_size: Optional[str] = Field(None, alias="paper_size")
    template_id: Optional[str] = Field(None, alias="template_id")
    header_text: Optional[str] = Field(None, alias="header_text")
    footer_text: Optional[str] = Field(None, alias="footer_text")
    primary_color: Optional[str] = Field(None, alias="primary_color")
    secondary_color: Optional[str] = Field(None, alias="secondary_color")
    logo_path: Optional[str] = Field(None, alias="logo_path")

