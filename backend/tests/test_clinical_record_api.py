
import pytest
from fastapi.testclient import TestClient
import sys
import os
# Ensure path is correct for imports if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.database import get_db, Base
from backend.models import User, Patient, ClinicalRecord
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import backend.auth as auth

# Reuse fixtures setup for simplicity in this specific test file
@pytest.fixture
def db_session():
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
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides = {}

@pytest.fixture
def auth_headers(db_session):
    email = "api_test@vita.com"
    user = User(email=email, hashed_password="hashed", is_verified=True, is_onboarded=True, professional_name="Dr. API")
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": email})
    return {"Authorization": f"Bearer {token}"}

def test_get_clinical_record_api_defaults(client, db_session, auth_headers):
    # Setup: Create Patient
    p = Patient(
        nombre="Api", 
        apellido_paterno="Test", 
        dni="API1", 
        fecha_nacimiento="2000-01-01",
        owner_id="api_test@vita.com"
    )
    db_session.add(p)
    db_session.commit()

    # Act: GET non-existent record
    res = client.get(f"/api/patients/{p.id}/clinical-record", headers=auth_headers)

    # Assert: Should match contract (Status 200, Empty Lists)
    assert res.status_code == 200
    data = res.json()
    assert data["allergies"] == []
    assert data["chronic_conditions"] == []
    assert data["current_medications"] == []
    assert data["blood_type"] is None
