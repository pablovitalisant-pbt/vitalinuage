from fastapi import APIRouter, Depends
from schemas import doctor as schemas
from dependencies import get_current_user
from models import User

router = APIRouter(
    prefix="/api/doctor",
    tags=["doctor"]
)

@router.get("/profile", response_model=schemas.DoctorProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "professional_name": current_user.professional_name or "Dr. Vitali",
        "specialty": current_user.specialty or "",
        "registration_number": current_user.registration_number or ""
    }

from sqlalchemy.orm import Session
from database import get_db
from schemas import auth_schemas

@router.post("/onboarding", response_model=auth_schemas.User)
def complete_onboarding(
    data: auth_schemas.OnboardingUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Update profile fields
    if data.professional_name:
        current_user.professional_name = data.professional_name
    if data.specialty:
        current_user.specialty = data.specialty
    if data.medical_license:
        current_user.medical_license = data.medical_license
    if data.registration_number:
        current_user.registration_number = data.registration_number
        
    # Mark as onboarded
    current_user.is_onboarded = True
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user
