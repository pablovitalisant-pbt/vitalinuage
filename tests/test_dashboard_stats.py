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

def test_dashboard_stats_endpoint():
    """
    Validates:
    1. GET /api/doctors/dashboard/stats returns 200 OK for authenticated user
    2. Response structure matches DashboardStats schema (checking key fields)
    """
    
    # A. Setup User
    db = TestingSessionLocal()
    email = f"stats_test_{uuid.uuid4()}@example.com"
    pwd = "secure_password"
    import backend.auth as auth_lib
    hashed = auth_lib.get_password_hash(pwd)
    
    user = User(
        email=email,
        hashed_password=hashed,
        is_verified=True,
        is_onboarded=True,  # Stats usually for onboarded docs
        professional_name="Dr. Stats"
    )
    db.add(user)
    db.commit()
    db.close()
    
    # B. Login to get token
    login_res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # C. Test GET /dashboard/stats
    response = client.get("/api/doctors/dashboard/stats", headers=headers)
    
    # Ensure 200 OK
    assert response.status_code == 200
    
    # Ensure structure
    data = response.json()
    assert "total_patients" in data
    assert "total_prescriptions" in data
    assert "weekly_patient_flow" in data
    assert isinstance(data["weekly_patient_flow"], list)
    assert len(data["weekly_patient_flow"]) == 7  # Logic returns 7 days

def test_dashboard_stats_zero_state():
    """
    Validates:
    1. Zero State Handling: Authenticated doctor with NO activity triggers no errors.
    2. Returns valid schema with zeros.
    """
    
    # A. Setup New User
    db = TestingSessionLocal()
    email = f"zero_state_{uuid.uuid4()}@example.com"
    pwd = "secure_password"
    import backend.auth as auth_lib
    hashed = auth_lib.get_password_hash(pwd)
    
    user = User(
        email=email,
        hashed_password=hashed,
        is_verified=True,
        is_onboarded=True,
        professional_name="Dr. Zero"
    )
    db.add(user)
    db.commit()
    db.close()
    
    # B. Login
    login_res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # C. Request Stats
    response = client.get("/api/doctors/dashboard/stats", headers=headers)
    
    assert response.status_code == 200, f"Zero state failed with {response.status_code}: {response.text}"
    data = response.json()
    
    assert data["total_patients"] == 0
    assert data["total_prescriptions"] == 0
    assert data["efficiency_rate"] == 0.0
    assert len(data["recent_activity"]) == 0

if __name__ == "__main__":
    test_dashboard_stats_endpoint()
    test_dashboard_stats_zero_state()
