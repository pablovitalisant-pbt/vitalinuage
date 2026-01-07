
import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base, engine
from models import User, Patient, ClinicalConsultation
import schemas
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from auth import get_password_hash
from dependencies import get_current_user

# Setup Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_prescriptions.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    # Drop tables
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def token(client):
    # Create User
    db = TestingSessionLocal()
    if not db.query(User).filter_by(email="presc_doctor@example.com").first():
        user = User(
            email="presc_doctor@example.com",
            hashed_password=get_password_hash("password"),
            professional_name="Dr. Prescription",
            is_verified=True
        )
        db.add(user)
        db.commit()
    db.close()
    
    # Login
    response = client.post("/api/auth/token", data={"username": "presc_doctor@example.com", "password": "password"})
    return response.json()["access_token"]

@pytest.fixture
def other_token(client):
    db = TestingSessionLocal()
    if not db.query(User).filter_by(email="other_presc@example.com").first():
        user = User(
            email="other_presc@example.com",
            hashed_password=get_password_hash("password"),
            professional_name="Dr. Other",
            is_verified=True
        )
        db.add(user)
        db.commit()
    db.close()
    return client.post("/api/auth/token", data={"username": "other_presc@example.com", "password": "password"}).json()["access_token"]

@pytest.fixture
def consultation_id(client, token):
    # Create Patient
    headers = {"Authorization": f"Bearer {token}"}
    p_res = client.post("/api/patients", json={
        "nombre": "Prescription", "apellido_paterno": "Patient", "dni": "P12345",
        "email": "p@test.com", "telefono": "123", "fecha_nacimiento": "1990-01-01", "genero": "M"
    }, headers=headers)
    p_id = p_res.json()["id"]
    
    # Create Consultation
    c_res = client.post(f"/api/patients/{p_id}/consultations", json={
        "reason": "Flu", "diagnosis": "Viral", "treatment": "Rest", "notes": "None"
    }, headers=headers)
    return c_res.json()["id"]

# Tests (Green Phase)

def test_create_prescription_success(client, token, consultation_id):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "consultation_id": consultation_id,
        "medications": [
            {"name": "Paracetamol", "dosage": "500mg", "frequency": "8h", "duration": "3 days"}
        ]
    }
    # Expected: 201 Created (Green)
    response = client.post(f"/api/patients/consultations/{consultation_id}/prescription", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["doctor_name"] == "Dr. Prescription"
    assert len(data["medications"]) == 1
    assert data["medications"][0]["name"] == "Paracetamol"
    return data["id"]

def test_get_prescription_success(client, token, consultation_id):
    # First create one
    presc_id = test_create_prescription_success(client, token, consultation_id)
    
    headers = {"Authorization": f"Bearer {token}"}
    # Expected: 200 OK (Green)
    response = client.get(f"/api/patients/prescriptions/{presc_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == presc_id
    assert data["patient_name"] == "Prescription Patient"
    assert data["medications"][0]["dosage"] == "500mg"

def test_validation_empty_medications(client, token, consultation_id):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "consultation_id": consultation_id,
        "medications": [] # Empty list should strictly fail validation logic we added (raising 422)
    }
    
    response = client.post(f"/api/patients/consultations/{consultation_id}/prescription", json=payload, headers=headers)
    # Logic explicitly checks for empty list and raises 422
    assert response.status_code == 422

def test_security_access(client, token, other_token, consultation_id):
    # Other doctor tries to create prescription for Patient owned by Doctor A.
    headers = {"Authorization": f"Bearer {other_token}"}
    payload = {
        "consultation_id": consultation_id,
        "medications": [{"name": "A", "dosage": "B", "frequency": "C", "duration": "D"}]
    }
    response = client.post(f"/api/patients/consultations/{consultation_id}/prescription", json=payload, headers=headers)
    
    # Logic checks ownership in step 1, raises 404 if not found/owned
    assert response.status_code == 404
