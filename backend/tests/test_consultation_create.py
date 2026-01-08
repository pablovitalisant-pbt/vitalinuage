from fastapi.testclient import TestClient
import uuid
import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app
from backend.database import get_db, Base
import backend.models as models
import backend.auth as auth

# Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
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
    yield TestClient(app)
    # Drop tables
    Base.metadata.drop_all(bind=engine_test)

@pytest.fixture(scope="function")
def db_session():
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

def test_create_consultation_returns_201_with_valid_data(client, db_session):
    """
    RED TEST: Verify POST /api/patients/{patient_id}/consultations creates consultation.
    
    EXPECTED TO FAIL: Endpoint exists but NewConsultation.tsx uses wrong endpoint.
    """
    # 1. Setup Auth
    email = f"doc_consult_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Create Patient
    patient = models.Patient(
        nombre="Juan",
        apellido_paterno="Pérez",
        dni="12345678",
        fecha_nacimiento="1990-01-15",
        owner_id=email,
        imc=24.5,
        sexo="M"
    )
    db_session.add(patient)
    db_session.commit()
    patient_id = patient.id
    
    # 3. Create Consultation
    consultation_data = {
        "reason": "Control de rutina",
        "diagnosis": "Paciente sano",
        "treatment": "Continuar con hábitos saludables",
        "notes": "Signos vitales normales"
    }
    
    response = client.post(
        f"/api/patients/{patient_id}/consultations",
        json=consultation_data,
        headers=headers
    )
    
    # 4. Assertions
    assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
    
    data = response.json()
    assert data["reason"] == "Control de rutina"
    assert data["diagnosis"] == "Paciente sano"
    assert data["treatment"] == "Continuar con hábitos saludables"
    assert "id" in data
    assert "created_at" in data

def test_create_consultation_returns_404_when_patient_not_found(client, db_session):
    """
    RED TEST: Verify POST returns 404 when patient doesn't exist.
    """
    # 1. Setup Auth
    email = f"doc_notfound_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Try to create consultation for non-existent patient
    consultation_data = {
        "reason": "Test",
        "diagnosis": "Test",
        "treatment": "Test"
    }
    
    response = client.post(
        "/api/patients/999999/consultations",
        json=consultation_data,
        headers=headers
    )
    
    # 3. Assertions
    assert response.status_code == 404, f"Expected 404 Not Found, got {response.status_code}"

def test_create_consultation_enforces_multitenancy(client, db_session):
    """
    RED TEST: Verify POST returns 404 for other user's patient (multi-tenancy).
    """
    # 1. Setup User 1 (Owner)
    email1 = f"doc_owner_{uuid.uuid4()}@vital.com"
    user1 = models.User(email=email1, hashed_password="pw", is_verified=True)
    db_session.add(user1)
    db_session.commit()
    
    # 2. Create Patient owned by User 1
    patient = models.Patient(
        nombre="Private",
        apellido_paterno="Patient",
        dni="87654321",
        fecha_nacimiento="1985-05-20",
        owner_id=email1,
        imc=22.0,
        sexo="F"
    )
    db_session.add(patient)
    db_session.commit()
    patient_id = patient.id
    
    # 3. Setup User 2 (Different User)
    email2 = f"doc_other_{uuid.uuid4()}@vital.com"
    user2 = models.User(email=email2, hashed_password="pw", is_verified=True)
    db_session.add(user2)
    db_session.commit()
    
    access_token2 = auth.create_access_token(data={"sub": email2})
    headers2 = {"Authorization": f"Bearer {access_token2}"}
    
    # 4. User 2 tries to create consultation for User 1's patient
    consultation_data = {
        "reason": "Unauthorized attempt",
        "diagnosis": "Should fail",
        "treatment": "N/A"
    }
    
    response = client.post(
        f"/api/patients/{patient_id}/consultations",
        json=consultation_data,
        headers=headers2
    )
    
    # 5. Assertions (Should return 404 to prevent enumeration)
    assert response.status_code == 404, f"Expected 404 Not Found (multi-tenancy), got {response.status_code}"

def test_create_consultation_requires_authentication(client, db_session):
    """
    RED TEST: Verify POST returns 401 without auth.
    """
    # 1. Request without auth headers
    consultation_data = {
        "reason": "Test",
        "diagnosis": "Test",
        "treatment": "Test"
    }
    
    response = client.post(
        "/api/patients/1/consultations",
        json=consultation_data
    )
    
    # 2. Assertions
    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"

def test_create_consultation_validates_required_fields(client, db_session):
    """
    RED TEST: Verify POST returns 422 when required fields missing.
    """
    # 1. Setup Auth
    email = f"doc_validation_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Create Patient
    patient = models.Patient(
        nombre="Test",
        apellido_paterno="Patient",
        dni="11111111",
        fecha_nacimiento="1990-01-01",
        owner_id=email,
        imc=25.0,
        sexo="M"
    )
    db_session.add(patient)
    db_session.commit()
    patient_id = patient.id
    
    # 3. Try to create consultation without required field 'reason'
    incomplete_data = {
        "diagnosis": "Test",
        "treatment": "Test"
    }
    
    response = client.post(
        f"/api/patients/{patient_id}/consultations",
        json=incomplete_data,
        headers=headers
    )
    
    # 4. Assertions
    assert response.status_code == 422, f"Expected 422 Unprocessable Entity, got {response.status_code}"
