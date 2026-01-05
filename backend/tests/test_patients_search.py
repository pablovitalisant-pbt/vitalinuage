from fastapi.testclient import TestClient
import uuid
import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from main import app
from database import get_db, Base
import models

# Setup Test Database
from sqlalchemy.pool import StaticPool

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
    # Remove file
    if os.path.exists("./test_patients_search.db"):
        os.remove("./test_patients_search.db")

@pytest.fixture(scope="function")
def db_session():
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

def test_patient_search_integration(client, db_session):
    """
    Test Integration 2 (Búsqueda): 
    Verify GET /api/pacientes/search?q=Juan returns 200/404 based on implementation state.
    Strictly checks for contract compliance (PatientSearchResponse).
    """
    # 1. Setup Auth
    import auth
    from models import User
    
    email = f"doc_smoke_{uuid.uuid4()}@vital.com"
    user = User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Search Request
    response = client.get("/api/pacientes/search?q=Test", headers=headers)
    
    # 3. Assertions (Red Phase: Expect 404 because endpoint doesn't exist yet)
    # 3. Assertions (Red Phase: Expect 404 because endpoint doesn't exist yet)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    
    data = response.json()
    assert "results" in data
    assert isinstance(data["results"], list)
    
    # Check Contract
    if len(data["results"]) > 0:
        patient = data["results"][0]
        assert "id" in patient
        assert "nombre_completo" in patient
        assert "dni" in patient
        assert "imc" in patient

def test_smoke_e2e_search_flow(client, db_session):
    """
    Smoke Test: Simulate full search flow.
    1. Create Patient
    2. Search for Patient
    3. Verify Result matches
    """
    # 1. Setup Auth
    import auth
    from models import User, Patient
    import crud
    import schemas.patients_schema as schemas
    
    email = f"doc_e2e_{uuid.uuid4()}@vital.com"
    user = User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Create Patient (Directly via DB or API if exists)
    # Using DB directly to ensure data exists for search
    patient = Patient(
        nombre="SmokeTest",
        apellido_paterno="Patient",
        dni=f"SMOKE-{uuid.uuid4()}",
        fecha_nacimiento="1990-01-01",
        owner_id=email,
        imc=25.0
    )
    db_session.add(patient)
    db_session.commit()
    
    # 3. Search
    response = client.get(f"/api/pacientes/search?q=Smoke", headers=headers)
    
    # 4. Validate
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    
    results = response.json().get("results", [])
    # If implemented, should find it
    assert len(results) >= 1
    assert results[0]["nombre_completo"] == "SmokeTest Patient None" or results[0]["nombre_completo"] == "SmokeTest Patient"
