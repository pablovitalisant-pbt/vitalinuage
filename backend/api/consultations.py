from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import models
import json
import os
import datetime
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

def check_tracking_flag():
    try:
        config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'feature-flags.json')
        with open(config_path, 'r') as f:
            flags = json.load(f)
            if not flags.get("tracking_envios", False):
                raise HTTPException(status_code=404, detail="Feature tracking_envios disabled")
    except FileNotFoundError:
         pass # Should be handled by main config check logic or ignored


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
    Crea un registro de verificaciÃ³n para una consulta.
    Reutiliza si ya existe (idempotente).
    
    - **consultation_id**: ID de la consulta
    - **Requiere autenticaciÃ³n**: Solo el mÃ©dico dueÃ±o
    
    Returns:
        {"uuid": "..."}
    """
    import uuid as uuid_lib
    import datetime
    
    # Verificar autorizaciÃ³n
    consultation = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.id == consultation_id,
        models.ClinicalConsultation.owner_id == current_user.email
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    # Buscar verificaciÃ³n existente
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.consultation_id == consultation_id
    ).first()
    
    if verification:
        # Retornar UUID existente (idempotente)
        return {"uuid": verification.uuid}
    
    # Crear nueva verificaciÃ³n
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


@verification_router.post("/{consultation_id}/send-email")
async def send_prescription_email(
    consultation_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    EnvÃ­a receta por email (asÃ­ncrono).
    
    - **consultation_id**: ID de la consulta
    - **Requiere autenticaciÃ³n**: Solo el mÃ©dico dueÃ±o
    
    Returns:
        {"status": "queued", "message": "..."}
    """
    import datetime
    from services.email_service import EmailService
    import uuid as uuid_lib
    
    # 1. Verificar autorizaciÃ³n
    consultation = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.id == consultation_id,
        models.ClinicalConsultation.owner_id == current_user.email
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    # 2. Validar email del paciente
    if not consultation.patient or not consultation.patient.email:
        raise HTTPException(
            status_code=400, 
            detail="Patient does not have an email address"
        )
    
    # 3. Obtener o crear verificaciÃ³n
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.consultation_id == consultation_id
    ).first()
    
    if not verification:
        verification = models.PrescriptionVerification(
            uuid=str(uuid_lib.uuid4()),
            consultation_id=consultation_id,
            doctor_email=current_user.email,
            doctor_name=current_user.professional_name or "Dr. Vitalinuage",
            issue_date=datetime.datetime.utcnow()
        )
        db.add(verification)
        db.commit()
        db.refresh(verification)
    
    # 4. Construir datos
    patient_name = f"{consultation.patient.nombre} {consultation.patient.apellido_paterno}"
    doctor_name = current_user.professional_name or "Dr. Vitalinuage"
    # Usar variable de entorno para BASE_URL, fallback a localhost
    base_url = os.getenv('BASE_URL', 'http://localhost:8000')
    pdf_url = f"{base_url}/v/{verification.uuid}/pdf"
    issue_date = verification.issue_date.strftime('%d/%m/%Y')
    
    # 5. Registrar envío (Timestamp)
    verification.email_sent_at = datetime.datetime.utcnow()
    db.commit()

    # 6. Añadir tarea en background
    background_tasks.add_task(
        EmailService.send_prescription_email,
        to_email=consultation.patient.email,
        patient_name=patient_name,
        doctor_name=doctor_name,
        pdf_url=pdf_url,
        issue_date=issue_date
    )
    
    # 6. Respuesta inmediata
    return {
        "status": "queued",
        "message": f"Email queued for delivery to {consultation.patient.email}"
    }

@verification_router.post("/{consultation_id}/mark-whatsapp-sent")
async def mark_whatsapp_sent(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_tracking_flag()

    # Verificar propiedad
    consultation = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.id == consultation_id,
        models.ClinicalConsultation.owner_id == current_user.email
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
        
    # Obtener verificacion
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.consultation_id == consultation_id
    ).first()
    
    if not verification:
        # Si no existe, crearla (edge case, pero create-verification deberia haber sido llamado antes)
        # Por simplicidad, retornamos error si no hay UUID generado
        raise HTTPException(status_code=400, detail="Debe generar el enlace primero")
        
    verification.whatsapp_sent_at = datetime.datetime.utcnow()
    db.commit()
    
    return {"success": True, "timestamp": verification.whatsapp_sent_at}

@verification_router.get("/{consultation_id}/dispatch-status")
async def get_dispatch_status(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_tracking_flag()

    consultation = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.id == consultation_id,
        models.ClinicalConsultation.owner_id == current_user.email
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    
    # Gracias a la propiedad hibrida aÃ±adida en models.py, esto es facil,
    # pero para el endpoint especifico consultamos la verification directa
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.consultation_id == consultation_id
    ).first()
    
    if not verification:
        return {"email_sent_at": None, "whatsapp_sent_at": None}
        
    return {
        "email_sent_at": verification.email_sent_at,
        "whatsapp_sent_at": verification.whatsapp_sent_at,
        "uuid": verification.uuid
    }



