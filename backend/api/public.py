from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend import models
from pydantic import BaseModel

public_router = APIRouter(
    prefix="/api/public",
    tags=["Public Verification"]
)

class VerificationResponse(BaseModel):
    status: str
    doctor_name: str
    patient_initials: str
    issue_date: str
    is_expired: bool = False

@public_router.get("/prescriptions/verify/{uuid}", response_model=VerificationResponse)
def verify_prescription_publicly(uuid: str, db: Session = Depends(get_db)):
    """
    Public endpoint to verify prescription validity via UUID.
    Does NOT return sensitive patient full data, only initials.
    """
    import logging
    logging.getLogger(__name__).info(f"Public Verification Attempt: {uuid}")
    
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.uuid == uuid
    ).first()
    
    if not verification:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
        
    # Validar integridad
    if not verification.consultation:
        raise HTTPException(status_code=404, detail="Datos de consulta corruptos")
        
    patient = verification.consultation.patient
    initials = f"{patient.nombre[0]}.{patient.apellido_paterno[0]}." if patient else "N/A"
    
    # Audit Scan
    verification.scanned_count += 1
    verification.last_scanned_at = datetime.utcnow()
    db.commit()
    
    return VerificationResponse(
        status="valid",
        doctor_name=verification.doctor_name,
        patient_initials=initials,
        issue_date=verification.issue_date.strftime("%Y-%m-%d"),
        is_expired=False # Logic for expiration can be added later
    )
