import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend import models
import uuid

def test_qr_models_presence():
    """Verifica la presencia de modelos para evitar F821"""
    assert hasattr(models, 'User')
    assert hasattr(models, 'Patient')
    assert hasattr(models, 'ClinicalConsultation')
    assert hasattr(models, 'PrescriptionVerification')

def test_create_verification_record(db_session: Session):
    # Setup de datos para verificar integridad de relaciones
    doctor = models.User(email=f"doc_{uuid.uuid4()}@test.com", professional_name="Dr. QR")
    db_session.add(doctor)
    
    patient = models.Patient(full_name="Paciente QR")
    db_session.add(patient)
    db_session.commit()
    
    consultation = models.ClinicalConsultation(
        patient_id=patient.id,
        doctor_id=doctor.id,
        reason="Test QR"
    )
    db_session.add(consultation)
    db_session.commit()
    
    verification = models.PrescriptionVerification(
        consultation_id=consultation.id,
        doctor_email=doctor.email,
        verification_uuid=str(uuid.uuid4())
    )
    db_session.add(verification)
    db_session.commit()
    
    assert verification.id is not None
    assert verification.doctor_email == doctor.email

def test_verification_endpoint_not_found(client: TestClient):
    response = client.get(f"/api/prescriptions/verify/{uuid.uuid4()}")
    assert response.status_code == 404