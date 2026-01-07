
import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from models import User, Patient, ClinicalConsultation, Prescription
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from auth import get_password_hash
from datetime import datetime, timedelta
import os

# Setup Test DB - File based for persistence debug
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dashboard.db"
# Remove StaticPool, use standard file engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    # Helper to clean db file if exists
    # Ensure connections are closed before removing
    engine.dispose()
    if os.path.exists("./test_dashboard.db"):
        try:
            os.remove("./test_dashboard.db")
        except PermissionError:
            pass # Best effort
        
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)
    
    engine.dispose()
    if os.path.exists("./test_dashboard.db"):
        try:
            os.remove("./test_dashboard.db")
        except PermissionError:
            pass

@pytest.fixture
def token(client):
    db = TestingSessionLocal()
    email = "dash_doctor@example.com"
    if not db.query(User).filter_by(email=email).first():
        user = User(
            email=email,
            hashed_password=get_password_hash("password"),
            professional_name="Dr. Dashboard",
        )
        user.is_verified = True
        db.add(user)
        db.commit()
    db.close()
    
    # Use /login endpoint which is known to work and accepts JSON
    res = client.post("/login", json={"email": email, "password": "password"})
    return res.json()["access_token"]

def test_dashboard_analytics(client, token):
    # 1. Setup Data: 
    # Create a patient and some consultations/prescriptions over the last 7 days
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Patient (we need to inject directly to avoid API complexity or use helper if available)
    # Using API for simplicity
    p_res = client.post("/api/patients", json={
        "nombre": "Dash", "apellido_paterno": "Test", "dni": "D111", "email": "d@t.com", "telefono": "1", "fecha_nacimiento": "2000-01-01", "genero": "M"
    }, headers=headers)
    patient_id = p_res.json()["id"]

    # Inject consultations into DB directly to manipulate 'created_at'
    db = TestingSessionLocal()
    doctor = db.query(User).filter_by(email="dash_doctor@example.com").first()
    
    # Add 3 consultations in the last 3 days
    for i in range(3):
        fake_date = datetime.utcnow() - timedelta(days=i)
        consult = ClinicalConsultation(
            patient_id=patient_id,
            owner_id=doctor.email,
            reason=f"Test {i}",
            created_at=fake_date
        )
        db.add(consult)
        db.commit()
        
        # Add a prescription for the first one only
        if i == 0:
            presc = Prescription(
                consultation_id=consult.id,
                doctor_id=doctor.email,
                patient_id=patient_id,
                date=fake_date
            )
            db.add(presc)
            db.commit()

    db.close()

    # 2. Call Dashboard Stats Endpoint
    response = client.get("/api/doctor/dashboard/stats", headers=headers)
    
    # 3. Assertions (Expect Success 200)
    assert response.status_code == 200
    data = response.json()
    
    # 4. Verify New Metrics (Red Test Expectations)
    
    # Total Prescriptions should be at least 1 (the one we injected)
    # Ensure current implementation (returning 0/default) fails this check
    assert data["total_prescriptions"] >= 1
    
    # Weekly Flow should have tracked the 3 consultations
    # weekly_patient_flow is List[int] of size 7
    assert len(data["weekly_patient_flow"]) == 7
    assert sum(data["weekly_patient_flow"]) >= 3 
    
    # Efficiency Rate: 1 prescription / 3 consultations ~= 33%
    assert data["efficiency_rate"] > 0
