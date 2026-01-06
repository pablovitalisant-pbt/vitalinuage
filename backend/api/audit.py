from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import PrescriptionVerification, ClinicalConsultation, Patient, User
from schemas.audit import DispatchAuditResponse, DispatchSummaryItem, DispatchStatus
from datetime import datetime
from typing import Optional
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
    current_user: User = Depends(get_current_user),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[DispatchStatus] = DispatchStatus.ALL
):
    check_audit_flag()
    
    # Query base
    query = db.query(PrescriptionVerification, ClinicalConsultation, Patient).\
        join(ClinicalConsultation, PrescriptionVerification.consultation_id == ClinicalConsultation.id).\
        join(Patient, ClinicalConsultation.patient_id == Patient.id)
    
    # Apply Filters
    if start_date:
        query = query.filter(PrescriptionVerification.issue_date >= start_date)
    if end_date:
        query = query.filter(PrescriptionVerification.issue_date <= end_date)
        
    if status and status != DispatchStatus.ALL:
        if status == DispatchStatus.PENDING:
            # Pending = Both channels null (Actually aligned with test v2)
            # v2 is pending (email=None, wa=None)
            query = query.filter(
                 PrescriptionVerification.email_sent_at == None,
                 PrescriptionVerification.whatsapp_sent_at == None
            )
        elif status == DispatchStatus.SENT:
            # Sent = At least one channel sent (Aligned with test v1 & v3)
            # v1 (email=Sent, wa=None) => Sent
            from sqlalchemy import or_
            query = query.filter(or_(
                PrescriptionVerification.email_sent_at != None,
                PrescriptionVerification.whatsapp_sent_at != None
            ))

    results = query.order_by(PrescriptionVerification.issue_date.desc()).all()
    
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
