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

def test_onboarding_persistence_failure(client):
    """
    Slice 20: Reproduce Infinite Onboarding Bug.
    User completes onboarding, but subsequent GET /profile fails to see changes.
    """
    db = TestingSessionLocal()
    
    # 1. Setup Auth (Create fresh user)
    uniq = str(uuid.uuid4())[:8]
    email = f"newuser_{uniq}@vital.com"
    user = models.User(
        email=email, 
        hashed_password="pw", 
        is_verified=True, 
        is_onboarded=False # Start as FALSE
    )
    db.add(user)
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    db.close()
    
    # 2. Verify Initial State (Should be Un-onboarded)
    res_get_init = client.get("/api/doctors/profile", headers=headers)
    assert res_get_init.status_code == 200
    assert res_get_init.json() == {"has_profile": False}
    print("DEBUG: Initial GET correct (has_profile: False)")

    # 3. Perform Post (Onboarding Action)
    post_payload = {
        "professionalName": "Dr. Test",
        "specialty": "Testing",
        "medicalLicense": "12345",
        "registrationNumber": "98765"
    }
    
    res_post = client.post("/api/doctors/profile", json=post_payload, headers=headers)
    
    # Assert successful POST
    assert res_post.status_code == 200
    data_post = res_post.json()
    assert data_post["isOnboarded"] is True
    print(f"DEBUG: POST Response isOnboarded: {data_post.get('isOnboarded')}")

    # 4. Verify Persistence (The Critical Step)
    # This simulates page refresh or subsequent navigation
    res_get_final = client.get("/api/doctors/profile", headers=headers)
    
    print(f"DEBUG: Final GET Body: {res_get_final.json()}")
    
    # If bug exists, this might return {"has_profile": False} or isOnboarded=False
    # We expect it to be TRUE for a working system.
    # If the user reported "Infinite Loop", this assertion will likely FAIL.
    
    assert res_get_final.status_code == 200
    final_data = res_get_final.json()
    
    # Check that it returns the full profile, not the "has_profile: False" stub
    assert "has_profile" not in final_data, "Backend returned 'No Profile' stub after Onboarding!"
    assert final_data["isOnboarded"] is True, "Backend returned isOnboarded=False after update!"
    assert final_data["professionalName"] == "Dr. Test"
