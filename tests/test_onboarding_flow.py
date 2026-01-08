from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.main import app
from backend.database import get_db, Base
from backend.models import User
import uuid
import pytest

# 1. Setup in-memory DB
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_onboarding_flow_api():
    """
    Validates:
    1. Verified but non-onboarded user gets {"has_profile": False} from GET /profile
    2. POST /profile creates/updates profile and sets is_onboarded=True
    3. Subsequent GET /profile returns full profile data
    """
    
    # A. Setup User
    db = TestingSessionLocal()
    email = f"onboard_test_{uuid.uuid4()}@example.com"
    pwd = "secure_password"
    # Create user manually to control state
    import backend.auth as auth_lib
    hashed = auth_lib.get_password_hash(pwd)
    
    user = User(
        email=email,
        hashed_password=hashed,
        is_verified=True,
        is_onboarded=False,
        verification_token=None,
        professional_name=None # Ensure empty profile
    )
    db.add(user)
    db.commit()
    db.close()
    
    # B. Login to get token
    login_res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # C. Test GET /profile for non-onboarded user
    # Expectation: 200 OK with specific flag, NOT 403 or 404
    profile_res = client.get("/api/doctors/profile", headers=headers)
    assert profile_res.status_code == 200
    data = profile_res.json()
    
    # If implemented correctly, this should have "has_profile": False or be a partial dict
    # Current implementation returns a full schema, we need to assert based on the NEW logic we will build.
    # Logic to build: If not onboarded, return special struct.
    assert data.get("has_profile") is False
    
    # D. Test POST /profile (Onboarding step)
    onboarding_data = {
        "professionalName": "Dr. Test Onboard",
        "specialty": "Neurology",
        "medicalLicense": "MED-12345",
        "registrationNumber": "REG-999"
    }
    
    # We need to ensure POST /api/doctors/profile works. 
    # Currently it might only be PUT /profile or POST /onboarding/complete.
    # The requirement is to standardize on /profile endpoint.
    update_res = client.post("/api/doctors/profile", headers=headers, json=onboarding_data)
    assert update_res.status_code == 200
    updated_user = update_res.json()
    assert updated_user["professionalName"] == "Dr. Test Onboard"
    assert updated_user["isOnboarded"] is True
    
    # E. Verify GET /profile now returns full profile
    profile_res_final = client.get("/api/doctors/profile", headers=headers)
    assert profile_res_final.status_code == 200
    final_data = profile_res_final.json()
    assert final_data.get("has_profile", True) is not False # Should NOT be False anymore
    assert final_data["professionalName"] == "Dr. Test Onboard"

if __name__ == "__main__":
    test_onboarding_flow_api()
