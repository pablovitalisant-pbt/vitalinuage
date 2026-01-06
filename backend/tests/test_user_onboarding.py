
import pytest
from fastapi.testclient import TestClient
from main import app
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
    # Create user first
    user = User(email="test@vitalinuage.com", hashed_password="hashed", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    token = auth.create_access_token(data={"sub": "test@vitalinuage.com"})
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

class TestOnboarding:

    def test_onboarding_success(self, client, auth_headers):
        """
        Verify that sending valid data updates the profile and setting is_onboarded=True.
        """
        payload = {
            "professional_name": "Dr. House",
            "specialty": "Diagnóstico",
            "medical_license": "12345",
            "onboarding_completed": True
        }
        
        response = client.put("/api/user/onboarding", json=payload, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["professional_name"] == "Dr. House"
        assert data["onboarding_completed"] is True

    def test_onboarding_validation_error(self, client, auth_headers):
        """
        Verify that missing fields result in 422 Unprocessable Entity.
        """
        payload = {
            "professional_name": "Dr. Incompleto"
            # Missing specialty, license, and completion flag
        }
        
        response = client.put("/api/user/onboarding", json=payload, headers=auth_headers)
        
        assert response.status_code == 422
