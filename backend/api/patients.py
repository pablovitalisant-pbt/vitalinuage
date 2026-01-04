from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas.patients_schema as schemas
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
