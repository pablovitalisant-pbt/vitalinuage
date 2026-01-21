from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from backend import models
import json
import os
from backend.database import get_db
from backend.dependencies import get_current_user
import datetime

router = APIRouter(
    prefix="/pacientes/{patient_id}/antecedentes",
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
    """
    Production (Cloud Run): reads flags from FEATURE_FLAGS_JSON env var.
    Local dev: falls back to config/feature-flags.json.
    If neither exists, defaults to "enabled" (does not block module).
    """
    # 1) Production: ENV (recommended)
    flags_json = os.getenv("FEATURE_FLAGS_JSON")
    if flags_json:
        try:
            flags = json.loads(flags_json)
        except json.JSONDecodeError:
            # If env var is malformed, fail open to avoid breaking prod.
            # (Optional: change to 503 if you'd rather fail closed.)
            return

        if not flags.get("medical_record_background_v1", False):
            raise HTTPException(status_code=503, detail="Feature disabled")
        return

    # 2) Local dev: file fallback
    try:
        config_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "config", "feature-flags.json"
        )
        with open(config_path, "r") as f:
            flags = json.load(f)
            if not flags.get("medical_record_background_v1", False):
                raise HTTPException(status_code=503, detail="Feature disabled")
    except FileNotFoundError:
        # Cloud Run may not have this file. Do not block the module.
        return


@router.get("", response_model=MedicalBackgroundResponse)
def get_medical_background(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
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
        # Return empty structure without persistence
        return MedicalBackgroundResponse(
            id=0,
            patient_id=patient_id,
            patologicos=None,
            no_patologicos=None,
            heredofamiliares=None,
            quirurgicos=None,
            alergias=None,
            medicamentos_actuales=None,
            updated_at=None,
        )

    return background


@router.put("", response_model=MedicalBackgroundResponse)
def update_medical_background(
    patient_id: int,
    background_data: MedicalBackgroundBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
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
