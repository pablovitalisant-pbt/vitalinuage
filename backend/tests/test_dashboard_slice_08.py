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
from backend import models

# Setup Test Database
from sqlalchemy.pool import StaticPool

# Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite://" # In-memory
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
    # Remove file
    if os.path.exists("./test_dashboard_slice_08.db"):
        os.remove("./test_dashboard_slice_08.db")

@pytest.fixture(scope="function")
def db_session():
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

def test_get_doctor_profile_structure(client, db_session):
    """
    Test Integration 1 (Doctor): Verify GET /api/doctor/profile returns DoctorProfile structure.
    Expected: 404 Not Found (initially) or 200 with valid schema once implemented.
    """
    # 1. Setup Auth
    email = f"doc_{uuid.uuid4()}@vital.com"
    # We need to register/create user in DB to have a valid user, otherwise get_current_user might fail on DB lookup?
    # Actually dependencies.py checks crud.get_user_by_email.
    # So we MUST create the user in DB first.
    from models import User
    hashed = "hashed_secret" # Mock hash
    user = User(email=email, hashed_password=hashed, is_verified=True, professional_name="Dr. Slice")
    db_session.add(user)
    db_session.commit()

    # 2. Generate Token
    # We need the SECRET_KEY used by the app. Main app loads from env.
    # The client fixture typically points to app which has the config.
    # Let's import auth from backend.
    import auth
    access_token = auth.create_access_token(data={"sub": email})
    
    headers = {"Authorization": f"Bearer {access_token}"}

    # 3. Request
    response = client.get("/api/doctor/profile", headers=headers)

    # 4. Assertions (TDD Phase -> Expecting Failure or 404 until implemented)
    # The requirement says "Confirmar que fallan con 404"
    # 4. Assertions (TDD Phase -> Expecting Failure or 404 until implemented)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    
    data = response.json()
    assert "professional_name" in data
    assert "specialty" in data
    assert "registration_number" in data

 
