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

from main import app
from database import get_db, Base
import json
import auth

# Force consistency for tests
auth.SECRET_KEY = "test_secret_key_fixed_for_consistency"

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
    Base.metadata.create_all(bind=engine_test)
    yield TestClient(app)
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

def test_medical_background_lifecycle(client, db_session):
    """
    Test Slice 09.1: Medical Background Lifecycle
    1. Setup: Create Doctor and Patient.
    2. GET /medical-background (expect empty/default).
    3. PUT /medical-background (update data).
    4. GET /medical-background (verify persistence).
    """
    # 0. Mock Feature Flag -> TRUE
    # We need to ensure the app thinks the flag is ON.
    # Since we can't easily mock the json load global, we assume the test environment
    # or the code uses a function we can mock. For now, since we haven't implemented
    # the flag check, we just write the test assuming the endpoint SHOULD exist.
    
    # 1. Auth Setup
    import auth
    from models import User, Patient
    
    email = f"doc_bg_{uuid.uuid4()}@vital.com"
    user = User(email=email, hashed_password="pw", professional_name="Dr. Background")
    user.is_verified = True
    db_session.add(user)
    db_session.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Create Patient
    patient = Patient(
        nombre="Background",
        apellido_paterno="Test",
        dni=f"BG-{uuid.uuid4()}",
        fecha_nacimiento="1980-01-01",
        owner_id=email, # Using exact same variable
        imc=22.0
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    
    # 3. GET Initial Background
    # Expectation: 200 OK with empty fields (Lazy creation or default empty)
    response = client.get(f"/api/pacientes/{patient.id}/antecedentes", headers=headers)
    assert response.status_code == 200, f"Expected 200 OK for initial get, got {response.status_code}"
    data = response.json()
    assert data["patologicos"] is None or data["patologicos"] == ""
    
    # 4. PUT Update
    payload = {
        "patologicos": "Diabetes Tipo 2",
        "no_patologicos": "Tabaquismo negativo",
        "alergias": "Penicilina"
    }
    response = client.put(f"/api/pacientes/{patient.id}/antecedentes", json=payload, headers=headers)
    assert response.status_code == 200, f"Update failed: {response.text}"
    updated_data = response.json()
    assert updated_data["patologicos"] == "Diabetes Tipo 2"
    
    # 5. Verify Persistence
    response = client.get(f"/api/pacientes/{patient.id}/antecedentes", headers=headers)
    verif_data = response.json()
    assert verif_data["alergias"] == "Penicilina"
    assert verif_data["patient_id"] == patient.id

def test_privacy_and_isolation(client, db_session):
    """
    Test Tenant Isolation:
    Doctor B cannot access Doctor A's patient background.
    """
    import auth
    from models import User, Patient
    
    # Owner A
    email_a = f"doc_a_{uuid.uuid4()}@vital.com"
    user_a = User(email=email_a, hashed_password="pw", professional_name="Dr. A")
    user_a.is_verified = True
    db_session.add(user_a)
    
    # Owner B
    email_b = f"doc_b_{uuid.uuid4()}@vital.com"
    user_b = User(email=email_b, hashed_password="pw", professional_name="Dr. B")
    user_b.is_verified = True
    db_session.add(user_b)
    db_session.commit()
    
    # Patient of A
    patient_a = Patient(
        nombre="Priv", apellido_paterno="Test", dni=f"PRIV-{uuid.uuid4()}",
        fecha_nacimiento="1990-01-01", owner_id=email_a
    )
    db_session.add(patient_a)
    db_session.commit()
    
    # Token for B
    access_token_b = auth.create_access_token(data={"sub": email_b})
    headers_b = {"Authorization": f"Bearer {access_token_b}"}
    
    # B tries to access A's patient background
    response = client.get(f"/api/pacientes/{patient_a.id}/antecedentes", headers=headers_b)
    
    # Should be 404 (Not Found) or 403 (Forbidden). 
    # Usually we prefer 404 to avoid leaking existence of patient.
    assert response.status_code in [404, 403]

def test_feature_flag_disabled(client, db_session):
    """
    Test Feature Flag:
    If 'medical_record_background_v1' is FALSE, endpoints should verify or 404.
    Since we cannot easily reload the global config in this test scope without
    patching, we will assume the implementation (Slice 09.2) will include
    a check. This test serves as the contract expectation.
    """
    pass # To be implemented when we can patch the config check logic or mock dependencies.
    # Ideally:
    # with mock.patch('dependencies.is_flag_enabled', return_value=False):
    #     resp = client.get(...)
    #     assert resp.status_code == 404

