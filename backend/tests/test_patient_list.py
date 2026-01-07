
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db, Base
from backend.models import User, Patient, ClinicalConsultation
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
    email = "list_test@vita.com"
    user = User(
        email=email,
        hashed_password="hashed",
        is_verified=True,
        is_onboarded=True,
        professional_name="Dr. List"
    )
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": email})
    return {"Authorization": f"Bearer {token}"}

def test_patient_list_pagination_and_ownership(client, db_session, auth_headers):
    # Setup Data
    email = "list_test@vita.com"
    
    # Create 15 patients for Dr. List
    patients = []
    for i in range(15):
        patients.append(Patient(
            nombre=f"Patient{i}", 
            apellido_paterno="Test", 
            dni=f"DNI{i}", 
            fecha_nacimiento="2000-01-01",
            owner_id=email
        ))
    
    # Create 1 patient for another doctor
    other_patient = Patient(
        nombre="Other", 
        apellido_paterno="Doc", 
        dni="OTHER", 
        fecha_nacimiento="2000-01-01",
        owner_id="other@vita.com"
    )
    
    db_session.add_all(patients + [other_patient])
    db_session.commit()
    
    # Act: Request Page 1, Size 10
    res = client.get("/api/patients?page=1&size=10", headers=auth_headers)
    
    # Assert
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 15
    assert len(data["data"]) == 10
    assert data["page"] == 1
    
    # Act: Request Page 2, Size 10
    res2 = client.get("/api/patients?page=2&size=10", headers=auth_headers)
    data2 = res2.json()
    assert len(data2["data"]) == 5
    assert data2["page"] == 2

def test_last_consultation_field(client, db_session, auth_headers):
    email = "list_test@vita.com"
    
    # Create Patient
    p = Patient(
        nombre="Consulted", 
        apellido_paterno="Patient", 
        dni="CONS1", 
        fecha_nacimiento="2000-01-01",
        owner_id=email
    )
    db_session.add(p)
    db_session.commit()
    
    # Create old consultation
    old_date = datetime.utcnow() - timedelta(days=10)
    c1 = ClinicalConsultation(
        patient_id=p.id, owner_id=email,
        reason="Old", diagnosis="A", treatment="A",
        created_at=old_date
    )
    
    # Create new consultation
    new_date = datetime.utcnow()
    c2 = ClinicalConsultation(
        patient_id=p.id, owner_id=email,
        reason="New", diagnosis="B", treatment="B",
        created_at=new_date
    )
    
    db_session.add_all([c1, c2])
    db_session.commit()
    
    # Act
    res = client.get("/api/patients?page=1", headers=auth_headers)
    
    # Assert
    data = res.json()["data"][0]
    assert data["id"] == p.id
    assert data["last_consultation"] is not None
    # Parse date string to verify it matches new_date (approx)
    returned_date = datetime.fromisoformat(data["last_consultation"])
    assert abs((returned_date - new_date).total_seconds()) < 5 # tolerance
