import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from main import app
from database import get_db, Base
import models

# Setup Test Database for Auth
# Setup Test Database for Auth
from sqlalchemy.pool import StaticPool
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

@pytest.fixture(scope="function")
def db_session():
    session = TestingSessionLocal()
    yield session
    session.close()

def test_registration_creates_unverified_user(client, db_session):
    """
    Test that registration now:
    1. Returns 201 Created (instead of 200)
    2. Does NOT return an access_token
    3. Creates user with is_verified=False
    4. Generates a verification_token and expiration
    """
    email = f"test_{uuid.uuid4()}@example.com"
    password = "password123"
    
    response = client.post("/register", json={"email": email, "password": password})
    
    # Needs to fail if logic isn't there yet (currently returns 200 + token)
    assert response.status_code == 201 
    data = response.json()
    assert "access_token" not in data
    assert "message" in data
    
    # Check DB
    user = db_session.query(models.User).filter(models.User.email == email).first()
    assert user is not None
    assert user.is_verified is False
    assert user.verification_token is not None
    assert user.verification_token_expires_at is not None

def test_unverified_user_cannot_login(client):
    """
    Test that an unverified user cannot login (receives 403).
    """
    email = f"unverified_{uuid.uuid4()}@example.com"
    password = "password123"
    
    # Register first
    client.post("/register", json={"email": email, "password": password})
    
    # Try login
    response = client.post("/login", json={"email": email, "password": password})
    
    # Should fail with 403 (Currently 200)
    assert response.status_code == 403
    assert response.json()["detail"] == "EMAIL_NOT_VERIFIED"

def test_verify_email_flow(client, db_session):
    """
    Test the full verification flow:
    1. Register
    2. Get token from DB
    3. Call /auth/verify
    4. Login successfully
    """
    email = f"verify_{uuid.uuid4()}@example.com"
    password = "password123"
    
    # 1. Register
    client.post("/register", json={"email": email, "password": password})
    
    # 2. Get token
    user = db_session.query(models.User).filter(models.User.email == email).first()
    token = user.verification_token
    
    # 3. Verify
    verify_response = client.post("/auth/verify", json={"token": token})
    assert verify_response.status_code == 200
    assert "access_token" in verify_response.json()
    
    # Check DB status
    db_session.refresh(user)
    assert user.is_verified is True
    assert user.verification_token is None # Should be cleared
    
    # 4. Login
    login_response = client.post("/login", json={"email": email, "password": password})
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

def test_verify_invalid_token(client):
    """Test verification with invalid token returns 400"""
    response = client.post("/auth/verify", json={"token": "invalid-token-123"})
    assert response.status_code == 400

def test_unverified_user_cannot_access_protected_route(client, db_session):
    """
    Test that an unverified user cannot access protected routes even with a valid token
    (e.g., token generated before lockout or bypassed).
    This validates the check in dependencies.py.
    """
    import auth # Import auth to generate token manually
    import uuid
    
    email = f"bypass_{uuid.uuid4()}@example.com"
    password = "password123"
    
    # 1. Create unverified user manually
    # We can use /register endpoint or DB directly. /register is easier/cleaner.
    client.post("/register", json={"email": email, "password": password})
    
    # 2. Generate valid JWT manually (bypassing /login check)
    access_token = auth.create_access_token(data={"sub": email})
    
    # 3. Access protected route
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/users/me", headers=headers)
    
    # 4. Expect 403 Forbidden
    assert response.status_code == 403
    assert response.json()["detail"] == "EMAIL_NOT_VERIFIED"
