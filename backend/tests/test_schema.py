
import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from models import User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import auth

# Fixtures (reused from test_user_onboarding.py)
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
    user = User(email="test_schema@vitalinuage.com", hashed_password="hashed", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    token = auth.create_access_token(data={"sub": "test_schema@vitalinuage.com"})
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

def test_user_endpoint_contract_compliance(client, auth_headers):
    """
    Integration: Verifies that /users/me returns all fields required by the new Schema Contract.
    Target fields: is_verified, is_onboarded, professional_name, specialty, medical_license.
    """
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    # Check for presence of new columns in the JSON response
    # These assertions will fail until auth_schemas.User is updated
    assert "is_verified" in data, "Field missing: is_verified"
    assert "is_onboarded" in data, "Field missing: is_onboarded"
    # Optional fields should be present as null, not missing
    assert "professional_name" in data, "Field missing: professional_name"
    assert "specialty" in data, "Field missing: specialty"
    assert "medical_license" in data, "Field missing: medical_license"
