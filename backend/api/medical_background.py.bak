from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from backend from backend import models
import json
import os
from database import get_db
from dependencies import get_current_user
import datetime

router = APIRouter(
    prefix="/api/pacientes/{patient_id}/antecedentes",
    tags=["antecedentes"]
)

# Schemas (Local implementation as per instruction, or could be in schemas/)
class MedicalBackgroundBase(BaseModel):
    patologicos: Optional[str] = None
    no_patologicos: Optional[str] = None
    heredofamiliares: Optional[str] = None
    quirurgicos: Optional[str] = None
    alergias: Optional[str] = None
    medicamentos_actuales: Optional[str] = None

class MedicalBackgroundResponse(MedicalBackgroundBase):
    id: int
    patient_id: int
    updated_at: Optional[datetime.datetime] = None

    class Config:
        orm_mode = True

# Helper for Feature Flag
def check_feature_flag():
    try:
        config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'feature-flags.json')
        with open(config_path, 'r') as f:
            flags = json.load(f)
            if not flags.get("medical_record_background_v1", False):
                raise HTTPException(status_code=404, detail="Feature disabled")
    except FileNotFoundError:
        # Default to safe closed if config missing
         raise HTTPException(status_code=404, detail="Configuration missing")

@router.get("", response_model=MedicalBackgroundResponse)
def get_medical_background(
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
        print(f"[API DEBUG] Patient {patient_id} not found for user {current_user.email}")
        # PBT-IA: 404 to avoid leaking existence
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Get Background
    background = db.query(models.MedicalBackground).filter(
        models.MedicalBackground.patient_id == patient_id
    ).first()
    
    # Lazy Creation or Return Empty
    if not background:
        # Return empty structure without persistence (Client usually handles "create on first save")
        # Or create an empty one in memory to satisfy response model
        return MedicalBackgroundResponse(id=0, patient_id=patient_id) 
        
    return background

@router.put("", response_model=MedicalBackgroundResponse)
def update_medical_background(
    patient_id: int,
    background_data: MedicalBackgroundBase,
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

    # 2. Get or Create
    background = db.query(models.MedicalBackground).filter(
        models.MedicalBackground.patient_id == patient_id
    ).first()

    if not background:
        background = models.MedicalBackground(patient_id=patient_id)
        db.add(background)
    
    # 3. Update Fields
    for key, value in background_data.dict(exclude_unset=True).items():
        setattr(background, key, value)
    
    background.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(background)
    
    return background
