import pytest
import datetime
import auth
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from main import app
from database import get_db, Base
from models import User, Patient, ClinicalConsultation, PrescriptionVerification
from unittest.mock import patch

# Fixtures for In-Memory Database
@pytest.fixture
def db_session():
    # Create in-memory SQLite database
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def auth_headers():
    # Generate valid token
    token = auth.create_access_token(data={"sub": "doctor@test.com"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def client(db_session):
    # Override the get_db dependency to use our in-memory session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides = {}

@pytest.fixture
def test_data(db_session):
    # Setup Data - Unconditional creates (Fresh DB)
    user = User(
        email="doctor@test.com", 
        hashed_password="hashed_pw", 
        professional_name="Dr. Test",
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    
    patient = Patient(
        nombre="Juan", 
        apellido_paterno="Pérez", 
        dni="12345678", 
        email="juan@test.com",
        owner_id="doctor@test.com",
        fecha_nacimiento="1990-01-01"
    )
    db_session.add(patient)
    db_session.commit()
    
    consultation = ClinicalConsultation(
        patient_id=patient.id,
        owner_id="doctor@test.com",
        motivo_consulta="Test Dispatch",
        diagnostico="Test",
        plan_tratamiento="Test plan"
    )
    db_session.add(consultation)
    db_session.commit()
    
    verification = PrescriptionVerification(
        uuid="uuid-dispatch-test",
        consultation_id=consultation.id,
        doctor_email="doctor@test.com",
        doctor_name="Dr. Test",
        issue_date=datetime.datetime.utcnow()
    )
    db_session.add(verification)
    db_session.commit()
    
    return {
        "user": user,
        "patient": patient,
        "consultation": consultation,
        "verification": verification
    }

class TestDispatchTracking:
    
    def test_send_email_updates_timestamp(self, client, test_data, db_session, auth_headers):
        consultation_id = test_data["consultation"].id
        
        with patch('api.consultations.check_tracking_flag') as mock_flag, \
             patch('resend.Emails.send') as mock_send, \
             patch('services.email_service.EmailService.send_prescription_email') as mock_service:
            
            mock_send.return_value = {'id': 'email_123'}
            mock_service.return_value = True
            
            response = client.post(
                f"/api/consultas/{consultation_id}/send-email",
                headers=auth_headers
            )
            
            # Expect 200 (implementation returns dict)
            assert response.status_code == 200
            
            # Verify using the SAME session
            db_session.expire_all()
            verification = db_session.query(PrescriptionVerification).filter_by(consultation_id=consultation_id).first()
            assert verification.email_sent_at is not None

    def test_mark_whatsapp_sent_endpoint(self, client, test_data, db_session, auth_headers):
        consultation_id = test_data["consultation"].id
        
        with patch('api.consultations.check_tracking_flag'):
            response = client.post(
                f"/api/consultas/{consultation_id}/mark-whatsapp-sent",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            assert response.json()["success"] is True
            
            db_session.expire_all()
            verification = db_session.query(PrescriptionVerification).filter_by(consultation_id=consultation_id).first()
            assert verification.whatsapp_sent_at is not None

    def test_get_dispatch_status_endpoint(self, client, test_data, auth_headers):
        consultation_id = test_data["consultation"].id
        
        with patch('api.consultations.check_tracking_flag'):
            response = client.get(
                f"/api/consultas/{consultation_id}/dispatch-status",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "email_sent_at" in data
            assert "whatsapp_sent_at" in data
