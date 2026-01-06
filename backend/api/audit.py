from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import PrescriptionVerification, ClinicalConsultation, Patient, User
from schemas.audit import DispatchAuditResponse, DispatchSummaryItem
from dependencies import get_current_user
import json
import os

router = APIRouter()

def check_audit_flag():
    try:
        # Path relative to backend/api/audit.py -> backend/api -> backend -> root -> config
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'config', 'feature-flags.json')
        if not os.path.exists(config_path):
             # Fallback for some envs
             config_path = os.path.join('config', 'feature-flags.json')
             
        with open(config_path, 'r') as f:
            flags = json.load(f)
            if not flags.get("audit_panel", False):
                raise HTTPException(status_code=404, detail="Feature not enabled")
    except Exception:
        # Fail safe
        raise HTTPException(status_code=404, detail="Feature check failed")

@router.get("/dispatch-summary", response_model=DispatchAuditResponse)
def get_dispatch_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_audit_flag()
    
    # Join Verification -> Consultation -> Patient to get all details
    results = db.query(PrescriptionVerification, ClinicalConsultation, Patient).\
        join(ClinicalConsultation, PrescriptionVerification.consultation_id == ClinicalConsultation.id).\
        join(Patient, ClinicalConsultation.patient_id == Patient.id).\
        order_by(PrescriptionVerification.issue_date.desc()).\
        all()
    
    items = []
    for verification, consultation, patient in results:
        items.append(DispatchSummaryItem(
            uuid=verification.uuid,
            consultation_id=verification.consultation_id,
            patient_name=f"{patient.nombre} {patient.apellido_paterno}",
            doctor_name=verification.doctor_name or "N/A",
            issue_date=verification.issue_date,
            email_sent_at=verification.email_sent_at,
            whatsapp_sent_at=verification.whatsapp_sent_at
        ))
    
    return DispatchAuditResponse(items=items, total_count=len(items))
