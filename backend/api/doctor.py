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
