from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
import models
import schemas.patients_schema as schemas
import schemas.patients as search_schemas
from database import get_db

router = APIRouter(
    prefix="/api/pacientes",
    tags=["pacientes"],
    responses={404: {"description": "Not found"}},
)

from dependencies import get_current_user
import crud
import schemas as schemas_auth

@router.post("", response_model=schemas.Patient)
def create_patient(
    patient: schemas.PatientCreate, 
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    # Inject owner_id from authenticated user
    return crud.create_patient(db=db, patient=patient, owner_id=current_user.email)

@router.get("", response_model=List[schemas.Patient])
def read_patients(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    return crud.get_patients(db=db, owner_id=current_user.email, skip=skip, limit=limit)

@router.get("/search", response_model=search_schemas.PatientSearchResponse)
def search_patients(
    q: str,
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    if len(q) < 2:
        return {"results": []}

    query = db.query(models.Patient).filter(models.Patient.owner_id == current_user.email)
    
    search_filter = or_(
        models.Patient.nombre.ilike(f"%{q}%"),
        models.Patient.apellido_paterno.ilike(f"%{q}%"),
        models.Patient.dni.ilike(f"%{q}%")
    )
    query = query.filter(search_filter)
    
    ps = query.all()
    
    mapped_results = []
    for p in ps:
        nombre_completo = f"{p.nombre} {p.apellido_paterno}"
        if p.apellido_materno:
            nombre_completo += f" {p.apellido_materno}"
            
        mapped_results.append({
            "id": p.id,
            "nombre_completo": nombre_completo,
            "dni": p.dni,
            "imc": p.imc
        })
        
    return {"results": mapped_results}
