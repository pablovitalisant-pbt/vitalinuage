from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import json
import os
from database import get_db
from dependencies import get_current_user
from schemas.consultations import ConsultationCreate, ConsultationResponse
from sqlalchemy import desc

router = APIRouter(
    prefix="/api/pacientes/{patient_id}/consultas",
    tags=["consultas"]
)

def check_feature_flag():
    try:
        config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'feature-flags.json')
        with open(config_path, 'r') as f:
            flags = json.load(f)
            if not flags.get("clinical_consultations_v1", False):
                raise HTTPException(status_code=404, detail="Feature disabled")
    except FileNotFoundError:
         raise HTTPException(status_code=404, detail="Configuration missing")

@router.post("", response_model=ConsultationResponse)
def create_consultation(
    patient_id: int,
    consultation: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_feature_flag()

    # 1. Verify Patient Ownership
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id,
        models.Patient.owner_id == current_user.email
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Create Consultation
    db_consultation = models.ClinicalConsultation(
        patient_id=patient_id,
        owner_id=current_user.email,
        **consultation.dict()
    )
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)
    
    return db_consultation

@router.get("", response_model=List[ConsultationResponse])
def list_consultations(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_feature_flag()

    # 1. Verify Patient Ownership
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id,
        models.Patient.owner_id == current_user.email
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # 2. List Consultations (Ordered by Date Desc)
    consultations = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.patient_id == patient_id
    ).order_by(desc(models.ClinicalConsultation.created_at)).all()

    return consultations


# New router for consultation-level operations (not patient-scoped)
verification_router = APIRouter(
    prefix="/api/consultas",
    tags=["consultas"]
)

@verification_router.post("/{consultation_id}/create-verification")
async def create_verification(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Crea un registro de verificación para una consulta.
    Reutiliza si ya existe (idempotente).
    
    - **consultation_id**: ID de la consulta
    - **Requiere autenticación**: Solo el médico dueño
    
    Returns:
        {"uuid": "..."}
    """
    import uuid as uuid_lib
    import datetime
    
    # Verificar autorización
    consultation = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.id == consultation_id,
        models.ClinicalConsultation.owner_id == current_user.email
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    # Buscar verificación existente
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.consultation_id == consultation_id
    ).first()
    
    if verification:
        # Retornar UUID existente (idempotente)
        return {"uuid": verification.uuid}
    
    # Crear nueva verificación
    verification = models.PrescriptionVerification(
        uuid=str(uuid_lib.uuid4()),
        consultation_id=consultation_id,
        doctor_email=current_user.email,
        doctor_name=current_user.professional_name or "Dr. Vitalinuage",
        issue_date=datetime.datetime.utcnow()
    )
    db.add(verification)
    db.commit()
    
    return {"uuid": verification.uuid}
