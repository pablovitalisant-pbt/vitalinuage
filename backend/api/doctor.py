from fastapi import APIRouter, Depends, HTTPException
from backend.schemas import doctor as schemas
from backend.dependencies import get_current_user
from backend.models import User

router = APIRouter(
    prefix="/api/doctor",
    tags=["doctor"]
)

@router.get("/profile", response_model=schemas.DoctorProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "professional_name": current_user.professional_name or "Dr. Vitali",
        "specialty": current_user.specialty or "",
        "registration_number": current_user.registration_number or "",
        "medical_license": current_user.medical_license,
        "is_onboarded": current_user.is_onboarded,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at if hasattr(current_user, "created_at") else None
    }

from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import auth_schemas

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
    if data.professional_name:
        current_user.professional_name = data.professional_name
    if data.specialty:
        current_user.specialty = data.specialty
    if data.medical_license:
        current_user.medical_license = data.medical_license
    if data.registration_number:
        current_user.registration_number = data.registration_number
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    
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
    from backend.models import Patient, ClinicalConsultation, Prescription
    from sqlalchemy import func, desc, and_
    from datetime import datetime, time, timedelta

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
    
    # 4. Total Prescriptions
    total_prescriptions = db.query(Prescription).filter(
        Prescription.doctor_id == current_user.email
    ).count()
    
    # 5. Weekly Patient Flow (Last 7 days)
    # We want an array of counts for [Today-6, Today-5, ..., Today]
    weekly_patient_flow = []
    today = datetime.utcnow().date()
    
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
        
    # 6. Efficiency Rate (Prescriptions / Consultations)
    # Using total historical counts for accumulated efficiency
    # Or should it be monthly? "Eficacia General" implies total.
    total_consultations = db.query(ClinicalConsultation).filter(
        ClinicalConsultation.owner_id == current_user.email
    ).count()
    
    efficiency_rate = 0.0
    if total_consultations > 0:
        efficiency_rate = (total_prescriptions / total_consultations) * 100
        # Cap at 100 if multiple prescriptions per consult? Usually 1:1 or 0:1.
        if efficiency_rate > 100: efficiency_rate = 100.0

    return {
        "total_patients": total_patients,
        "appointments_today": appointments_today,
        "pending_tasks": 0,
        "recent_activity": recent_activity,
        "total_prescriptions": total_prescriptions,
        "weekly_patient_flow": weekly_patient_flow,
        "efficiency_rate": round(efficiency_rate, 1)
    }
