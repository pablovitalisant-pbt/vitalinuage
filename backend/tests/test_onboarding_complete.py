
import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from models import User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import auth

# Reuse fixtures with a slight tweak for "Incomplete User"
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

def create_user_and_token(db, email, profile_data=None):
    user = User(
        email=email,
        hashed_password="hashed",
        is_verified=True,
        is_onboarded=False, # Initially False
        **profile_data if profile_data else {}
    )
    db.add(user)
    db.commit()
    token = auth.create_access_token(data={"sub": email})
    return {"Authorization": f"Bearer {token}"}

# Test 1: Fail if profile is incomplete
def test_finalize_onboarding_fails_incomplete_profile(client, db_session):
    # User with NO profile data
    headers = create_user_and_token(db_session, "incomplete@vita.com")
    
    response = client.post("/api/doctor/onboarding/complete", headers=headers)
    
    # Expect failure (400 Bad Request or similar, logic to be implemented)
    # Since stub does nothing, it might return 500 or 200 with nulls depending on pass behavior.
    # We assert strict behavior: Should be 400.
    assert response.status_code == 400
    assert "incomplete" in response.text.lower() # Optional check for error message

# Test 2: Success if profile is complete (Red Test)
def test_finalize_onboarding_success_complete_profile(client, db_session):
    # User with FULL profile data
    profile = {
        "professional_name": "Dr. Complete",
        "specialty": "Oncology",
        "medical_license": "LIC-999",
        "registration_number": "REG-888"
    }
    headers = create_user_and_token(db_session, "complete@vita.com", profile)
    
    response = client.post("/api/doctor/onboarding/complete", headers=headers)
    
    # Logic is 'pass', so this will fail to return User or fail to update is_onboarded
    assert response.status_code == 200
    data = response.json()
    assert data["is_onboarded"] is True
