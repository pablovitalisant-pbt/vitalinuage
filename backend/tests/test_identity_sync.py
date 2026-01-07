
import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from models import User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
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
    user = User(
        email="identity_test@vitalinuage.com", 
        hashed_password="hashed", 
        is_verified=True, 
        is_onboarded=True,
        registration_number="REG-TEST-101"
    )
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": "identity_test@vitalinuage.com"})
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

def test_profile_returns_registration_number(client, auth_headers):
    """
    Verifies that /api/doctor/profile now includes 'registration_number' 
    as part of the identity sync contract.
    """
    response = client.get("/api/doctor/profile", headers=auth_headers);
    assert response.status_code == 200
    data = response.json()
    
    # This might fail if the endpoint logic hasn't been updated to map 
    # the field from the model to the response schema, or if schema is missing it.
    assert "registration_number" in data
    assert data["registration_number"] == "REG-TEST-101"
