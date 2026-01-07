import pytest
from fastapi.testclient import TestClient
from main import app
from datetime import datetime
from backend.models import User
from backend.schemas.doctor import DoctorProfileBase
from backend.services.onboarding import update_doctor_profiler
from sqlalchemy.pool import StaticPool
import auth

# Reuse fixtures
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
def auth_headers(db_session):
    user = User(email="onboarding_test@vitalinuage.com", hashed_password="hashed", is_verified=True, is_onboarded=False)
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": "onboarding_test@vitalinuage.com"})
    return {"Authorization": f"Bearer {token}"}

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

def test_pydantic_contract_validation(client, auth_headers):
    """
    Validates that the Pydantic schema accepts the new optional fields.
    PASSED expected: The schema is already defined in Phase A.
    """
    payload = {
        "professional_name": "Test Dr.",
        "specialty": "Testing",
        "medical_license": "12345",
        "registration_number": "REG-999"
    }
    # This might fail 404 if endpoint is not mounted, or 422 if schema mismatch.
    # Assuming endpoint exists but does logic.
    response = client.post("/api/doctor/onboarding", json=payload, headers=auth_headers)
    
    # We expect 200 OK because the Phase A defined the endpoint shell that returns current_user.
    # It validates input but doesn't save it yet.
    assert response.status_code == 200

def test_onboarding_saves_to_neon_fails(client, auth_headers):
    """
    Validates that the data is NOT persisted yet (Logic missing).
    FAILED expected: We assert that data is saved, but it won't be because Phase C is not done.
    """
    payload = {
        "professional_name": "Dr. Persistence",
        "specialty": "Cardiology",
        "medical_license": "CARDIO-1"
    }
    
    client.post("/api/doctor/onboarding", json=payload, headers=auth_headers)
    
    # Check DB
    response = client.get("/users/me", headers=auth_headers)
    data = response.json()
    
    # This assertion should FAIL because the endpoint currently just returns the user without updating DB
    assert data["professional_name"] == "Dr. Persistence"
    assert data["is_onboarded"] is True
