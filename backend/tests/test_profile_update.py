
import pytest
from fastapi.testclient import TestClient
from main import app
from schemas.user import UserUpdate
from pydantic import ValidationError
from database import get_db, Base
from models import User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import auth

# Fixtures
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
    user = User(
        email="profile_update_test@vitalinuage.com",
        hashed_password="hashed",
        is_verified=True,
        is_onboarded=True
    )
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": "profile_update_test@vitalinuage.com"})
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

# Unit Test for Schema
def test_user_update_schema_validation():
    """
    Verifies that the UserUpdate schema correctly validates constraints.
    """
    # Valid Data
    valid_data = {
        "professional_name": "Dr. House",
        "specialty": "Diagnostic",
        "medical_license": "123456",
        "registration_number": "REG-123"
    }
    model = UserUpdate(**valid_data)
    assert model.professional_name == "Dr. House"

    # Invalid Data (Name too short)
    invalid_data = valid_data.copy()
    invalid_data["professional_name"] = "Dr"
    with pytest.raises(ValidationError):
        UserUpdate(**invalid_data)

# Integration Test (Red Test)
def test_update_profile_endpoint_success(client, auth_headers):
    """
    Verifies that the endpoint successfully updates the profile.
    """
    payload = {
        "professional_name": "Dr. Unique",
        "specialty": "Dermatology",
        "medical_license": "99999",
        "registration_number": "REG-999"
    }
    
    response = client.put("/api/doctor/profile", json=payload, headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["professional_name"] == "Dr. Unique"
    assert data["specialty"] == "Dermatology"
    assert data["registration_number"] == "REG-999"
