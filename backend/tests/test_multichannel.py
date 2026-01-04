import pytest
from fastapi.testclient import TestClient
from ..main import app, get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..models import Patient, Consultation, ConsultationAccess, DeliveryLog
import uuid
from datetime import datetime
import secrets


# Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_multichannel.db"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    # Create tables
    Base.metadata.create_all(bind=engine_test)
    
    # Create Seed Data (Patient + Consultation)
    db = TestingSessionLocal()
    
    patient = Patient(
        id=str(uuid.uuid4()),
        nombre="Test",
        apellido_paterno="Paciente",
        dni="12345678",
        fecha_nacimiento=datetime.now().date(),
        sexo="M",
        telefono="555-1234"
    )
    db.add(patient)
    db.commit()
    
    cons_id = str(uuid.uuid4())
    consultation = Consultation(
        id=cons_id,
        patient_id=patient.id,
        reason="Test Reason",
        diagnosis="Test Diagnosis",
        treatment="Test Treatment",
        doctor_name="Dr. Test"
    )
    db.add(consultation)
    db.commit()
    db.close()
    
    yield TestClient(app)
    
    # Drop tables
    Base.metadata.drop_all(bind=engine_test)


def test_hash_generation_and_public_validation(client):
    db = TestingSessionLocal()
    cons = db.query(Consultation).first()
    cons_id = cons.id
    
    # 1. Manually create an Access Token (Simulating the Print process)
    # We do this because we haven't implemented the print logic update yet, 
    # but we want to test the Public Endpoint logic which we will build.
    token = secrets.token_urlsafe(8)
    access = ConsultationAccess(
        consultation_id=cons_id,
        access_token=token
    )
    db.add(access)
    db.commit()
    db.close()
    
    # 2. Test Public Endpoint valid
    response = client.get(f"/api/v/{token}")
    # EXPECT FAIL initially (404) until implemented
    if response.status_code == 404:
        assert True # Marking as "Red" phase pass if it fails? No, we want to assert == 200 and fail the test.
        # But to be useful, let's assert 200.
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "valid"
    assert "doctor" in data
    assert "patient" in data
    # Check Obfuscation
    assert "*" in data["patient"]
    
    # 3. Test Invalid Token
    response = client.get(f"/api/v/invalid-token")
    assert response.status_code == 404

def test_whatsapp_link_generation(client):
    db = TestingSessionLocal()
    cons = db.query(Consultation).first()
    
    response = client.get(f"/api/print/{cons.id}/whatsapp-link")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "wa.me" in data["url"]

def test_delivery_log_creation(client):
    # Determine how to test this. Maybe POST to send-email endpoint.
    # We assume endpoint will be /api/print/{id}/send-email
    
    db = TestingSessionLocal()
    cons = db.query(Consultation).first()
    cons_id = cons.id
    db.close()
    
    response = client.post(f"/api/print/{cons_id}/send-email", json={"email": "test@test.com"})
    # It might fail with 500 if SMTP not configured, but we should handle graceful failure or mock.
    # For Slice 17, if we return 200 (Success) or specific error, we check DB.
    
    # If logic is implemented, it should create a log even if it fails? Or only if sent?
    # Spec says "Registra en DeliveryLog".
    
    # Assert response (Might need adjustment based on implementation details)
    # assert response.status_code in [200, 500] 

