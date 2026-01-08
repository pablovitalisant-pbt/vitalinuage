from fastapi.testclient import TestClient
import uuid
import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import StaticPool

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app
from backend.database import get_db, Base
import backend.models as models
import backend.auth as auth

# Setup Test Database - In-Memory SQLite
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(scope="module")
def client():
    # Create tables
    Base.metadata.create_all(bind=engine_test)
    yield TestClient(app)
    # Drop tables
    Base.metadata.drop_all(bind=engine_test)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

def test_update_patient_partial_success(client):
    """
    Test PATCH /api/patients/{id} updates specific fields without affecting others.
    """
    # Use a fresh session for setup
    db = TestingSessionLocal()
    
    # 1. Setup Auth
    email = f"doc_update_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db.add(user)
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Create Patient
    patient = models.Patient(
        nombre="OriginalName",
        apellido_paterno="OriginalSurname",
        dni="11122233",
        fecha_nacimiento="1990-01-01",
        owner_id=email,
        telefono="000-0000",
        email="old@patient.com",
        sexo="M",
        imc=20.0
    )
    db.add(patient)
    db.commit()
    patient_id = patient.id
    db.close()
    
    # 3. Perform Partial Update (PATCH)
    # Only updating telefono and email. nombre/dni should remain.
    update_payload = {
        "telefono": "999-9999",
        "email": "updated@patient.com"
    }
    
    response = client.patch(f"/api/patients/{patient_id}", json=update_payload, headers=headers)
    
    # Debug print
    if response.status_code != 200:
        print(f"DEBUG: Status {response.status_code}, Body: {response.text}")

    # 4. Assertions
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    
    data = response.json()
    assert data["id"] == patient_id
    # Updated fields
    assert data["telefono"] == "999-9999"
    assert data["email"] == "updated@patient.com"
    # Unchanged fields
    assert data["nombre"] == "OriginalName"
    assert data["dni"] == "11122233"
    assert data["imc"] == 20.0  # Float check

    # 5. Verify persistence (New session)
    db_verify = TestingSessionLocal()
    db_patient = db_verify.query(models.Patient).filter(models.Patient.id == patient_id).first()
    assert db_patient.telefono == "999-9999"
    assert db_patient.nombre == "OriginalName"
    db_verify.close()

def test_update_patient_not_found(client):
    """
    Test PATCH returns 404 if patient doesn't exist.
    """
    db = TestingSessionLocal()
    # 1. Setup Auth
    email = f"doc_404_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db.add(user)
    db.commit()
    db.close()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Try update
    response = client.patch("/api/patients/999999", json={"telefono": "123"}, headers=headers)
    assert response.status_code == 404

def test_update_patient_security_multitenancy(client):
    """
    Test PATCH returns 404 if patient belongs to another user.
    """
    db = TestingSessionLocal()
    # 1. Setup Owner and Other
    email1 = f"owner_{uuid.uuid4()}@vital.com"
    email2 = f"other_{uuid.uuid4()}@vital.com"
    
    user1 = models.User(email=email1, hashed_password="pw", is_verified=True)
    user2 = models.User(email=email2, hashed_password="pw", is_verified=True)
    db.add_all([user1, user2])
    db.commit()
    
    # 2. Create Patient for User 1
    patient = models.Patient(
        nombre="Target",
        apellido_paterno="Target",
        dni="99988877",
        fecha_nacimiento="1990-01-01",
        owner_id=email1,
        sexo="F"
    )
    db.add(patient)
    db.commit()
    patient_id = patient.id
    db.close()
    
    # 3. User 2 tries to update
    access_token2 = auth.create_access_token(data={"sub": email2})
    headers2 = {"Authorization": f"Bearer {access_token2}"}
    
    response = client.patch(f"/api/patients/{patient_id}", json={"nombre": "Hacked"}, headers=headers2)
    
    # 4. Assert
    assert response.status_code == 404

