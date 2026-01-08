from fastapi.testclient import TestClient
import uuid
import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app
from backend.database import get_db, Base
import backend.models as models
import backend.auth as auth

# Setup Test Database - In-Memory SQLite
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(scope="module")
def client():
    # Create tables
    Base.metadata.create_all(bind=engine_test)
    yield TestClient(app)
    # Drop tables
    Base.metadata.drop_all(bind=engine_test)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

def test_get_profile_when_not_onboarded(client):
    """
    Slice 20 Regression Test:
    Ensures GET /profile returns the full profile object (with isOnboarded=False)
    instead of the legacy {"has_profile": False} stub.
    """
    db = TestingSessionLocal()
    
    # 1. Setup User (Not Onboarded)
    uniq = str(uuid.uuid4())[:8]
    email = f"regression_{uniq}@vital.com"
    user = models.User(
        email=email, 
        hashed_password="pw", 
        is_verified=True, 
        is_onboarded=False, # Critical: False
        professional_name="Dr. Regression", # Should be returned, even if not onboarded
        specialty="Testing"
    )
    db.add(user)
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    db.close()
    
    # 2. Get Profile
    res = client.get("/api/doctors/profile", headers=headers)
    
    # 3. Assertions
    assert res.status_code == 200
    data = res.json()
    
    print(f"DEBUG RESPONSE: {data}")
    
    # This assertion expects the NEW behavior (State-Aware)
    # It should FAIL with current code which returns {"has_profile": False}
    if "has_profile" in data and data["has_profile"] is False:
         pytest.fail(f"RED STATE CONFIRMED: Backend returned legacy stub: {data}")

    assert "has_profile" not in data, "Backend returned legacy 'has_profile' stub"
    assert data["email"] == email
    assert data["professionalName"] == "Dr. Regression"
    assert data["isOnboarded"] is False
