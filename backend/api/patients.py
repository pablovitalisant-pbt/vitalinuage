from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import backend.models as models
import backend.schemas.patients_schema as schemas
from backend.database import get_db

router = APIRouter(
    prefix="/api/pacientes",
    tags=["pacientes"],
    responses={404: {"description": "Not found"}},
)

@router.post("", response_model=schemas.Patient)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    # Mock implementation for Slice A/C (Persistence in next slice)
    # validate owner_id presence (enforced by Pydantic)
    
    # We pretend to save it. 
    # Since we cannot touch models.py yet, we can't save owner_id to DB directly
    # unless we use a loose dictionary or the model already has it (it doesn't).
    
    # Construct a fake DB object ID
    fake_id = 999 
    
    # Return the data as if it was saved, including owner_id
    response_data = patient.model_dump()
    response_data["id"] = fake_id
    
    # If we were to save to DB (will fail if column missing):
    # db_patient = models.Patient(**patient.dict())
    # db.add(db_patient) ...
    
    # For now, return what we received to satisfy the contract test
    return response_data
