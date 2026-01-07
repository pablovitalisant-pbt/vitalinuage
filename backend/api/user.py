from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from backend from backend import models
import schemas.user as schemas
from dependencies import get_current_user

router = APIRouter(
    prefix="/api/user",
    tags=["user"]
)

@router.put("/onboarding", response_model=schemas.OnboardingUpdate)
def update_onboarding_profile(
    data: schemas.OnboardingUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the professional profile of the user during onboarding.
    """
    current_user.professional_name = data.professional_name
    current_user.specialty = data.specialty
    current_user.medical_license = data.medical_license
    
    # Update status only if explicitly completed
    if data.onboarding_completed:
        current_user.is_onboarded = True

    db.commit()
    db.refresh(current_user)
    
    return {
        "professional_name": current_user.professional_name,
        "specialty": current_user.specialty,
        "medical_license": current_user.medical_license,
        "onboarding_completed": current_user.is_onboarded
    }
