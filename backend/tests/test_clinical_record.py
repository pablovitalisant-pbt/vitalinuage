
import pytest
from fastapi.testclient import TestClient
import sys
import os
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # Redundant if running properly

from main import app
from database import get_db, Base
from models import User, Patient, ClinicalRecord
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import auth
import json

# Fixtures similar to before (can be centralized in conftest.py ideally, but redundant here for isolation)
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
    email = "cr_test@vita.com"
    user = User(email=email, hashed_password="hashed", is_verified=True, is_onboarded=True, professional_name="Dr. CR")
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": email})
    return {"Authorization": f"Bearer {token}"}

def test_get_clinical_record_empty(client, db_session, auth_headers):
    # Create Patient
    p = Patient(
        nombre="Test", 
        apellido_paterno="CR", 
        dni="CR1", 
        fecha_nacimiento="1990-01-01",
        owner_id="cr_test@vita.com"
    )
    db_session.add(p)
    db_session.commit()
    
    # GET (should return empty default or 404, prompt implies "o una ficha vacía por defecto", I'll choose empty default as it's better UX for upsert)
    # Actually prompt says: "GET retorna 404 si la ficha no existe aún (o una ficha vacía por defecto)"
    # I'll implement returning empty default structure to simplify frontend.

    res = client.get(f"/api/patients/{p.id}/clinical-record", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["allergies"] == []
    assert data["blood_type"] is None

def test_update_clinical_record_upsert(client, db_session, auth_headers):
    # Create Patient
    p = Patient(
        nombre="Upsert", 
        apellido_paterno="Test", 
        dni="UP1", 
        fecha_nacimiento="1990-01-01",
        owner_id="cr_test@vita.com"
    )
    db_session.add(p)
    db_session.commit()
    
    payload = {
        "blood_type": "O+",
        "allergies": ["Penicillin", "Dust"],
        "chronic_conditions": ["Asthma"],
        "current_medications": [],
        "family_history": "Diabetes"
    }
    
    # PUT
    res = client.put(f"/api/patients/{p.id}/clinical-record", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["blood_type"] == "O+"
    assert "Penicillin" in data["allergies"]
    
    # Verify DB persistence
    rec = db_session.query(ClinicalRecord).filter_by(patient_id=p.id).first()
    assert rec is not None
    assert rec.blood_type == "O+"
    # Check JSON storage (Assuming JSON/String storage for lists)
    assert "Penicillin" in rec.allergies 

def test_access_denied_other_doctor(client, db_session, auth_headers):
    # Patient owned by OTHER
    p = Patient(
        nombre="Other", 
        apellido_paterno="P", 
        dni="OTH", 
        fecha_nacimiento="1990-01-01",
        owner_id="other@vita.com"
    )
    db_session.add(p)
    db_session.commit()
    
    res = client.get(f"/api/patients/{p.id}/clinical-record", headers=auth_headers)
    assert res.status_code == 404 # Or 403, but 404 is safer to hide existence
