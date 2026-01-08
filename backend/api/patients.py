from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from backend import models
import backend.schemas.patients_schema as schemas
import backend.schemas.patients as search_schemas
from backend.schemas.patient import (
    PatientListResponse, 
    ClinicalRecord,
    ConsultationItem,
    ConsultationCreate,
    PrescriptionCreate,
    PrescriptionResponse,
    MedicationItem
)
from backend.database import get_db

router = APIRouter(
    # Prefix managed in main.py
    tags=["patients"],
    responses={404: {"description": "Not found"}},
)

from backend.dependencies import get_current_user
import backend.crud as crud
import backend.schemas as schemas_auth

@router.post("", response_model=schemas.Patient)
def create_patient(
    patient: schemas.PatientCreate, 
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    # Inject owner_id from authenticated user
    return crud.create_patient(db=db, patient=patient, owner_id=current_user.email)

@router.get("/search", response_model=search_schemas.PatientSearchResponse)
def search_patients(
    q: str,
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    """
    Search patients by name or DNI.
    
    IMPORTANT: This route MUST be defined BEFORE /{patient_id} to avoid route conflicts.
    """
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

@router.get("/{patient_id}", response_model=schemas.Patient)
def get_patient_by_id(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    """
    Get a single patient by ID.
    
    Security: Enforces multi-tenancy by verifying owner_id matches current user.
    Returns 404 if patient not found or belongs to different user (prevents enumeration).
    """
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id,
        models.Patient.owner_id == current_user.email
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient


@router.get("", response_model=PatientListResponse)
def read_patients(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str = Query(None, min_length=1),
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    """
    Get paginated list of patients with status and last consultation.
    """
    from sqlalchemy import func, desc
    
    # 1. Base Query
    query = db.query(models.Patient).filter(models.Patient.owner_id == current_user.email)
    
    # Apply Search
    if search:
        search_filter = or_(
            models.Patient.nombre.ilike(f"%{search}%"),
            models.Patient.apellido_paterno.ilike(f"%{search}%"),
            models.Patient.dni.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # 2. Total Count
    total = query.count()
    
    # 3. Pagination
    offset = (page - 1) * size
    patients = query.order_by(models.Patient.id.desc()).offset(offset).limit(size).all()
    
    # 4. Map Data
    data = []
    for p in patients:
        # Get Last Consultation
        last_date = db.query(func.max(models.ClinicalConsultation.created_at)).filter(
            models.ClinicalConsultation.patient_id == p.id
        ).scalar()
        
        full_name = f"{p.nombre} {p.apellido_paterno}"
        if p.apellido_materno:
            full_name += f" {p.apellido_materno}"
            
        data.append({
            "id": p.id,
            "full_name": full_name,
            "id_number": p.dni,
            "last_consultation": last_date,
            "status": "Activo" # Default status logic for now
        })
        
    return {
        "data": data,
        "total": total,
        "page": page,
        "size": size
    }

@router.get("/{patient_id}/clinical-record", response_model=ClinicalRecord)
def get_clinical_record(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    """Get clinical record for a patient."""
    # 1. Verify Patient Ownership
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id, 
        models.Patient.owner_id == current_user.email
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # 2. Get Record
    record = db.query(models.ClinicalRecord).filter(models.ClinicalRecord.patient_id == patient_id).first()
    
    if not record:
        # Return empty default
        return ClinicalRecord(
            blood_type=None,
            allergies=[],
            chronic_conditions=[],
            family_history=None,
            current_medications=[]
        )
        
    return record

@router.put("/{patient_id}/clinical-record", response_model=ClinicalRecord)
def update_clinical_record(
    patient_id: int,
    record: ClinicalRecord,
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    """Update clinical record for a patient (Upsert)."""
    # 1. Verify Patient Ownership
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id, 
        models.Patient.owner_id == current_user.email
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # 2. Upsert
    db_record = db.query(models.ClinicalRecord).filter(models.ClinicalRecord.patient_id == patient_id).first()
    
    if not db_record:
        db_record = models.ClinicalRecord(patient_id=patient_id)
        db.add(db_record)
        
    # Update fields
    db_record.blood_type = record.blood_type
    db_record.allergies = record.allergies
    db_record.chronic_conditions = record.chronic_conditions
    db_record.family_history = record.family_history
    db_record.current_medications = record.current_medications
    
    db.commit()
    db.refresh(db_record)
    
    return db_record


@router.get("/{patient_id}/consultations", response_model=List[ConsultationItem])
def get_patient_consultations(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    # 1. Verify Patient Ownership (Strict Security)
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id, 
        models.Patient.owner_id == current_user.email
    ).first()
    
    if not patient:
        # Prevent enumeration
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Query Consultations
    consultations = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.patient_id == patient_id
    ).order_by(models.ClinicalConsultation.created_at.desc()).all()
    
    # 3. Map to Response (Ensure date is present)
    # If model doesn't have 'date', we map created_at to date for the schema
    results = []
    for c in consultations:
        # Ensure we handle the 'date' requirement if it's missing in model but required in schema
        # We assume 'c' respects Pydantic from_attributes, but let's be explicit if needed.
        # However, due to property limits, we rely on Pydantic mapping 'created_at' -> 'created_at'.
        # For 'date', if missing, we default to created_at logic if we added a property or if we modify dict.
        # Let's trust Pydantic or add a dynamic fix.
        # Hack: Add 'date' attribute dynamically if missing
        if not hasattr(c, 'date'):
            c.date = c.created_at 
        results.append(c)
        
    return results

@router.post("/{patient_id}/consultations", response_model=ConsultationItem, status_code=201)
def create_patient_consultation(
    patient_id: int,
    consultation: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    # 1. Verify Patient Ownership
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id, 
        models.Patient.owner_id == current_user.email
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # 2. Create Consultation (map English schema to Spanish model columns)
    db_consultation = models.ClinicalConsultation(
        patient_id=patient_id,
        owner_id=current_user.email,
        motivo_consulta=consultation.reason,  # reason -> motivo_consulta
        diagnostico=consultation.diagnosis,    # diagnosis -> diagnostico
        plan_tratamiento=consultation.treatment,  # treatment -> plan_tratamiento
        examen_fisico=consultation.notes or ""  # notes -> examen_fisico
        # created_at is auto
    )
    
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)
    
    # 3. Map Spanish model fields back to English schema for response
    return ConsultationItem(
        id=db_consultation.id,
        reason=db_consultation.motivo_consulta,
        diagnosis=db_consultation.diagnostico,
        treatment=db_consultation.plan_tratamiento,
        notes=db_consultation.examen_fisico,
        date=db_consultation.created_at,
        created_at=db_consultation.created_at
    )

@router.post("/consultations/{consultation_id}/prescription", status_code=201, response_model=PrescriptionResponse)
def create_prescription(
    consultation_id: int,
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    # 1. Verify Consultation & Ownership
    consultation = db.query(models.ClinicalConsultation).join(models.Patient).filter(
        models.ClinicalConsultation.id == consultation_id,
        models.Patient.owner_id == current_user.email
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found or access denied")
        
    # 2. Check for empty medications (Business Logic)
    if not prescription.medications:
        raise HTTPException(status_code=422, detail="Prescription must adhere to schema (min 1 medication)")

    # 3. Create Prescription
    db_prescription = models.Prescription(
        consultation_id=consultation_id,
        doctor_id=current_user.email,
        patient_id=consultation.patient_id,
        # date defaults to now
    )
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)
    
    # 4. Create Medications
    db_meds = []
    for med in prescription.medications:
        db_med = models.Medication(
            prescription_id=db_prescription.id,
            name=med.name,
            dosage=med.dosage,
            frequency=med.frequency,
            duration=med.duration,
            notes=med.notes
        )
        db.add(db_med)
        db_meds.append(db_med)
    
    db.commit()
    
    # 5. Build Response
    # Assuming current_user.professional_name exists or we construct it
    doctor_name = current_user.professional_name if current_user.professional_name else current_user.email
    patient_name = f"{consultation.patient.nombre} {consultation.patient.apellido_paterno}"
    
    return PrescriptionResponse(
        id=db_prescription.id,
        date=db_prescription.date,
        doctor_name=doctor_name,
        patient_name=patient_name,
        medications=[MedicationItem(
            name=m.name, 
            dosage=m.dosage, 
            frequency=m.frequency, 
            duration=m.duration, 
            notes=m.notes
        ) for m in db_meds]
    )

@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: schemas_auth.User = Depends(get_current_user)
):
    # 1. Query Prescription with verification
    # Join with Patient to check owner_id matches current_user
    # Also fetch medications eagerly if possible or allowed by lazy load
    presc = db.query(models.Prescription).join(models.Patient).filter(
        models.Prescription.id == prescription_id,
        models.Patient.owner_id == current_user.email
    ).first()
    
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    # 2. Fetch User/Patient details for response
    # We already have Patient in presc.patient (lazy loaded)
    # Doctor name: We should query the User table using presc.doctor_id
    doctor = db.query(models.User).filter(models.User.email == presc.doctor_id).first()
    doctor_name = doctor.professional_name if doctor and doctor.professional_name else "Dr. Unknown"
    
    patient_name = f"{presc.patient.nombre} {presc.patient.apellido_paterno}"
    
    return PrescriptionResponse(
        id=presc.id,
        date=presc.date,
        doctor_name=doctor_name,
        patient_name=patient_name,
        medications=[MedicationItem(
            name=m.name, 
            dosage=m.dosage, 
            frequency=m.frequency, 
            duration=m.duration, 
            notes=m.notes
        ) for m in presc.medications]
    )

