from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import models
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.schemas.prescription_map import PrescriptionMapCreate, PrescriptionMapResponse

router = APIRouter(
    prefix="/api/maps",
    tags=["mapeo_recetas"]
)

@router.get("", response_model=List[PrescriptionMapResponse])
def get_maps(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    maps = db.query(models.PrescriptionMap).filter(
        models.PrescriptionMap.doctor_id == current_user.email
    ).all()
    return maps

@router.get("/current", response_model=PrescriptionMapResponse)
def get_current_map(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Return the active one, or the last created one
    pmap = db.query(models.PrescriptionMap).filter(
        models.PrescriptionMap.doctor_id == current_user.email,
        models.PrescriptionMap.is_active == True
    ).order_by(models.PrescriptionMap.updated_at.desc()).first()
    
    if not pmap:
        raise HTTPException(status_code=404, detail="No active map found")
    return pmap

@router.post("", response_model=PrescriptionMapResponse)
def create_or_update_map(
    map_create: PrescriptionMapCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Deactivate others? (Simple logic: only 1 active)
    if map_create.is_active:
        db.query(models.PrescriptionMap).filter(
            models.PrescriptionMap.doctor_id == current_user.email
        ).update({"is_active": False})
    
    # 2. Convert Pydantic fields_config to list of dicts for JSON storage
    # SQLAlchemy JSON type handles basic python dicts/lists.
    fields_data = [
        f.model_dump() if hasattr(f, "model_dump") else f.dict()
        for f in map_create.fields_config
    ]
    
    new_map = models.PrescriptionMap(
        doctor_id=current_user.email,
        name=map_create.name,
        canvas_width_mm=map_create.canvas_width_mm,
        canvas_height_mm=map_create.canvas_height_mm,
        fields_config=fields_data,
        is_active=map_create.is_active
    )
    
    db.add(new_map)
    db.commit()
    db.refresh(new_map)
    return new_map

