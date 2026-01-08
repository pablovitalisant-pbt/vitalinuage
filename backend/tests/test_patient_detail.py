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

def test_get_patient_by_id_returns_patient_data(client, db_session):
    """
    RED TEST: Verify GET /api/patients/{patient_id} returns patient data.
    
    EXPECTED TO FAIL: Endpoint does not exist yet (404 or 405).
    """
    # 1. Setup Auth
    email = f"doc_detail_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Create Patient
    patient = models.Patient(
        nombre="Juan",
        apellido_paterno="Pérez",
        apellido_materno="García",
        dni="12345678",
        fecha_nacimiento="1990-01-15",
        owner_id=email,
        imc=24.5,
        sexo="M"
    )
    db_session.add(patient)
    db_session.commit()
    patient_id = patient.id
    
    # 3. Request Patient Detail
    response = client.get(f"/api/patients/{patient_id}", headers=headers)
    
    # 4. Assertions (RED: Should fail because endpoint doesn't exist)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    
    data = response.json()
    assert data["id"] == patient_id
    assert data["nombre"] == "Juan"
    assert data["apellido_paterno"] == "Pérez"
    assert data["dni"] == "12345678"
    assert data["imc"] == 24.5

def test_get_patient_by_id_returns_404_when_not_found(client, db_session):
    """
    RED TEST: Verify GET /api/patients/999999 returns 404.
    
    EXPECTED TO FAIL: Endpoint does not exist yet.
    """
    # 1. Setup Auth
    email = f"doc_notfound_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Request Non-existent Patient
    response = client.get("/api/patients/999999", headers=headers)
    
    # 3. Assertions
    assert response.status_code == 404, f"Expected 404 Not Found, got {response.status_code}"

def test_get_patient_by_id_enforces_multitenancy(client, db_session):
    """
    RED TEST: Verify GET /api/patients/{patient_id} returns 404 for other user's patient.
    
    EXPECTED TO FAIL: Endpoint does not exist yet.
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
    
    # 4. User 2 tries to access User 1's patient
    response = client.get(f"/api/patients/{patient_id}", headers=headers2)
    
    # 5. Assertions (Should return 404 to prevent enumeration)
    assert response.status_code == 404, f"Expected 404 Not Found (multi-tenancy), got {response.status_code}"

def test_get_patient_by_id_requires_authentication(client, db_session):
    """
    RED TEST: Verify GET /api/patients/{patient_id} returns 401 without auth.
    
    EXPECTED TO FAIL: Endpoint does not exist yet (will get 404 before 401).
    """
    # 1. Request without auth headers
    response = client.get("/api/patients/1")
    
    # 2. Assertions
    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
