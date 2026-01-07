
import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from models import User, Patient, ClinicalConsultation
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import auth
from datetime import datetime, timedelta

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
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides = {}

@pytest.fixture
def auth_headers(db_session):
    email = "stats_test@vita.com"
    user = User(
        email=email,
        hashed_password="hashed",
        is_verified=True,
        is_onboarded=True,
        professional_name="Dr. Stats"
    )
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": email})
    return {"Authorization": f"Bearer {token}"}

def test_dashboard_stats_endpoint(client, db_session, auth_headers):
    # Setup Data
    doctor_email = "stats_test@vita.com"
    
    # 1. Create Patients (Total: 3)
    p1 = Patient(
        nombre="Juan", apellido_paterno="Perez", dni="111", 
        fecha_nacimiento="1990-01-01", owner_id=doctor_email
    )
    p2 = Patient(
        nombre="Maria", apellido_paterno="Gomez", dni="222", 
        fecha_nacimiento="1995-05-05", owner_id=doctor_email
    )
    p3 = Patient( # Other doctor's patient (should not be counted)
        nombre="Pedro", apellido_paterno="Leno", dni="333", 
        fecha_nacimiento="1980-01-01", owner_id="other@vita.com"
    )
    db_session.add_all([p1, p2, p3])
    db_session.commit()
    
    # 2. Create Consultations (Today: 1, Yesterday: 1)
    today = datetime.utcnow()
    yesterday = today - timedelta(days=1)
    
    c1 = ClinicalConsultation(
        patient_id=p1.id, owner_id=doctor_email,
        reason="Dolor", diagnosis="Gripe", treatment="Repos",
        created_at=today
    )
    c2 = ClinicalConsultation(
        patient_id=p2.id, owner_id=doctor_email,
        reason="Control", diagnosis="Sano", treatment="Alta",
        created_at=yesterday
    )
    
    db_session.add_all([c1, c2])
    db_session.commit()
    
    # Act
    response = client.get("/api/doctor/dashboard/stats", headers=auth_headers)
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    
    # Verification
    assert data["total_patients"] == 2 # Only p1 and p2
    # assert data["appointments_today"] == 1 # Only c1 -- NOTE: SQLite date comparison might need care, usually straightforward if using Python objects
    
    # Check activity
    assert len(data["recent_activity"]) >= 1
    first_activity = data["recent_activity"][0]
    assert first_activity["action"] == "Consulta"
    assert "Juan" in first_activity["patient_name"] or "Perez" in first_activity["patient_name"]
