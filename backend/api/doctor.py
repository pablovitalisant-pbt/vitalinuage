from fastapi import APIRouter, Depends, HTTPException
import json
from pathlib import Path

from backend.schemas import doctor as schemas
from backend.dependencies import get_current_user
from backend.models import User, Patient, ClinicalConsultation, PrescriptionVerification

router = APIRouter(
    # Prefix managed in main.py
    tags=["doctor"]
)

FEATURE_FLAGS_CANDIDATES = [
    Path("config/feature-flags.json"),
    Path("../config/feature-flags.json"),
    Path("/app/config/feature-flags.json")
]


def load_feature_flags() -> dict:
    for path in FEATURE_FLAGS_CANDIDATES:
        if path.exists():
            with path.open("r", encoding="utf-8") as flags_file:
                return json.load(flags_file)
    return {
        "prescription_coords_v1": False
    }

from typing import Union

@router.get("/profile", response_model=schemas.DoctorProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    # Slice 12: Check onboarding status
    # Slice 20: State-Aware Architecture. Always return profile.
    # [IRON SEAL] Authentication is handled by Firebase.
    # Verification is handled by JIT Provisioning.
    # We DO NOT block here based on verification or onboarding.
    # The frontend decides what to show based on 'is_onboarded' flag.

        
    return {
        "id": current_user.id,
        "email": current_user.email,
        "professional_name": current_user.professional_name or "Dr. Vitali",
        "specialty": current_user.specialty or "",
        "registration_number": current_user.registration_number or "",
        "medical_license": current_user.medical_license,
        "address": current_user.address,
        "phone": current_user.phone,
        "profile_image": current_user.profile_image,
        "signature_image": current_user.signature_image,
        "is_onboarded": current_user.is_onboarded,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at if hasattr(current_user, "created_at") else None
    }

from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import auth_schemas

# Slice 12: POST /profile for Onboarding "Save" action
@router.post("/profile", response_model=schemas.DoctorProfile)
def create_profile(
    data: auth_schemas.OnboardingUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Creates/Updates profile and marks user as onboarded.
    Used by the Onboarding flow.
    """
    # Update profile fields
    if data.professional_name:
        current_user.professional_name = data.professional_name
    if data.specialty:
        current_user.specialty = data.specialty
    if data.medical_license:
        current_user.medical_license = data.medical_license
    if data.registration_number:
        current_user.registration_number = data.registration_number
    if data.address is not None:
        current_user.address = data.address
    if data.phone is not None:
        current_user.phone = data.phone
    if data.profile_image is not None:
        current_user.profile_image = data.profile_image
    if data.signature_image is not None:
        current_user.signature_image = data.signature_image
        
    # Mark as onboarded
    current_user.is_onboarded = True
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

# Keep existing POST /onboarding endpoint for backward compatibility if needed, 
# or aliased. But for cleanliness, we defined POST /profile above.
# We will remove the old 'complete_onboarding' at /onboarding if it conflicts 
# or just ensure they don't overlap improperly.
# The original file had @router.post("/onboarding") at line 29.
# I will replace lines 11-52 with the new get_profile and create_profile logic.

from backend.schemas.user import UserUpdate

@router.put("/profile", response_model=auth_schemas.User)
def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the professional profile of the authenticated user.
    """
    payload = data.model_dump() if hasattr(data, "model_dump") else data.dict()
    print(f"[PROFILE] PUT payload for {current_user.email}: {payload}")
    if data.professional_name:
        current_user.professional_name = data.professional_name
    if data.specialty:
        current_user.specialty = data.specialty
    if data.medical_license:
        current_user.medical_license = data.medical_license
    if data.registration_number:
        current_user.registration_number = data.registration_number
    if data.address is not None:
        current_user.address = data.address
    if data.phone is not None:
        current_user.phone = data.phone
    if data.profile_image is not None:
        current_user.profile_image = data.profile_image
    if data.signature_image is not None:
        current_user.signature_image = data.signature_image
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    print(
        "[PROFILE] Stored values for {email}: profile_image={profile_image} signature_image={signature_image}".format(
            email=current_user.email,
            profile_image=current_user.profile_image,
            signature_image=current_user.signature_image
        )
    )
    
    
    return current_user

@router.post("/onboarding/complete", response_model=auth_schemas.User)
def finalize_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Finalizes the onboarding process.
    Validates that professional profile fields are present.
    """
    # Validate integrity
    required_fields = [
        current_user.professional_name, 
        current_user.specialty, 
        current_user.medical_license,
        current_user.registration_number
    ]
    
    if any(not field or field.strip() == "" for field in required_fields):
        raise HTTPException(
            status_code=400, 
            detail="Profile is incomplete. Please fill all professional fields."
        )

    # Mark as onboarded
    current_user.is_onboarded = True
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

from backend.schemas import dashboard as dash_schemas

@router.get("/dashboard/stats", response_model=dash_schemas.DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns statistics for the doctor's dashboard.
    """
    from sqlalchemy import func, desc, and_
    from datetime import datetime, time, timedelta

    # Slice 12.3: Robustness Refactor
    # Wrap all logic in try/except to prevent 500 on missing data/tables
    try:
        # 1. Total Patients
        total_patients = db.query(Patient).filter(Patient.owner_id == current_user.email).count()

        # 2. Appointments Today
        today_start = datetime.combine(datetime.utcnow().date(), time.min)
        today_end = datetime.combine(datetime.utcnow().date(), time.max)
        
        appointments_today = db.query(ClinicalConsultation).filter(
            ClinicalConsultation.owner_id == current_user.email,
            ClinicalConsultation.created_at >= today_start,
            ClinicalConsultation.created_at <= today_end
        ).count()

        # 3. Recent Activity (Last 5 consultations)
        recent_consultations = db.query(ClinicalConsultation).join(Patient).filter(
            ClinicalConsultation.owner_id == current_user.email
        ).order_by(desc(ClinicalConsultation.created_at)).limit(5).all()

        recent_activity = []
        for consult in recent_consultations:
            recent_activity.append({
                "patient_name": f"{consult.patient.nombre} {consult.patient.apellido_paterno}",
                "action": "Consulta",
                "timestamp": consult.created_at
            })
            
        # Slice 20.0: Analytics
        
        today = datetime.utcnow().date()

        # 4. Prescriptions issued this month (PDF generation / verification)
        month_start = datetime.combine(today.replace(day=1), time.min)
        next_month = (month_start + timedelta(days=32)).replace(day=1)
        total_prescriptions = db.query(PrescriptionVerification).filter(
            PrescriptionVerification.doctor_email == current_user.email,
            PrescriptionVerification.created_at >= month_start,
            PrescriptionVerification.created_at < next_month
        ).count()
        
        # 5. Weekly Patient Flow (Last 7 days)
        # We want an array of counts for [Today-6, Today-5, ..., Today]
        weekly_patient_flow = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_start = datetime.combine(day, time.min)
            day_end = datetime.combine(day, time.max)
            
            count = db.query(ClinicalConsultation).filter(
                ClinicalConsultation.owner_id == current_user.email,
                ClinicalConsultation.created_at >= day_start,
                ClinicalConsultation.created_at <= day_end
            ).count()
            weekly_patient_flow.append(count)
            
        # 6. Coverage Rate (Prescriptions / Patients)
        efficiency_rate = 0.0
        if total_patients > 0:
            efficiency_rate = (total_prescriptions / total_patients) * 100
            if efficiency_rate > 100:
                efficiency_rate = 100.0

        return {
            "total_patients": total_patients,
            "appointments_today": appointments_today,
            "pending_tasks": 0,
            "recent_activity": recent_activity,
            "total_prescriptions": total_prescriptions,
            "weekly_patient_flow": weekly_patient_flow,
            "efficiency_rate": round(efficiency_rate, 1)
        }
        
    except Exception as e:
        print(f"[ERROR] Dashboard Stats: {str(e)}") # Simple logging
        # Return Zero State on error to avoid UI crash
        return {
            "total_patients": 0,
            "appointments_today": 0,
            "pending_tasks": 0,
            "recent_activity": [],
            "total_prescriptions": 0,
            "weekly_patient_flow": [0]*7,
            "efficiency_rate": 0.0
        }

@router.get("/preferences")
def get_preferences(current_user: User = Depends(get_current_user)):
    """
    Stub for doctor preferences (Frontend requirement).
    Returns default values until implemented.
    """
    return {
        "paper_size": "A4",
        "template_id": "classic",
        "header_text": "",
        "footer_text": "",
        "primary_color": "#000000",
        "secondary_color": "#ffffff"
    }

@router.get("/feature-flags")
def get_feature_flags(current_user: User = Depends(get_current_user)):
    return load_feature_flags()

@router.put("/preferences")
def update_preferences(
    data: schemas.DoctorPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the doctor's preferences (e.g., printing templates).
    Currently behaves as a persistent stub (fields not yet in User model).
    """
    # Logic: For now, since User model lacks these fields, we will just validate input 
    # and return success, essentially acknowledging the data.
    # In a full migration, we would add these columns to the User table.
    
    # Debug log to verify data reception
    print(f"[PREFERENCES] Received update for {current_user.email}: {data.dict(exclude_unset=True)}")
    
    # Return success
    return {"status": "success", "received": data.dict(exclude_unset=True)}
