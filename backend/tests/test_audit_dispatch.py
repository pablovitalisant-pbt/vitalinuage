import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db, Base
from backend.models import User, Patient, ClinicalConsultation, PrescriptionVerification
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import auth
from unittest.mock import patch

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
def auth_headers():
    token = auth.create_access_token(data={"sub": "audit_doctor@test.com"})
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

@pytest.fixture
def setup_audit_data(db_session):
    user = User(
        email="audit_doctor@test.com", 
        hashed_password="hashed_pw", 
        professional_name="Dr. Audit",
        is_verified=True
    )
    db_session.add(user)
    
    patient = Patient(
        nombre="Audit", 
        apellido_paterno="Patient", 
        dni="99999999", 
        email="audit@test.com",
        owner_id="audit_doctor@test.com",
        fecha_nacimiento="1990-01-01"
    )
    db_session.add(patient)
    db_session.commit()
    
    consultation = ClinicalConsultation(
        patient_id=patient.id,
        owner_id="audit_doctor@test.com",
        reason="Audit Reason",
        diagnosis="Audit Diagnosis",
        treatment="Audit Plan"
    )
    db_session.add(consultation)
    db_session.commit()
    
    verification = PrescriptionVerification(
        uuid="uuid-audit-123",
        consultation_id=consultation.id,
        doctor_email="audit_doctor@test.com",
        doctor_name="Dr. Audit",
        issue_date=datetime.utcnow(),
        email_sent_at=datetime.utcnow(),
        whatsapp_sent_at=None
    )
    db_session.add(verification)
    db_session.commit()
    
    return verification

class TestAuditDispatch:
    
    def test_get_dispatch_summary(self, client, db_session, auth_headers, setup_audit_data):
        """
        Test retrieving the dispatch summary.
        Should return a list of dispatched items matching the contract.
        """
        with patch('api.audit.check_audit_flag'):
             response = client.get("/api/audit/dispatch-summary", headers=auth_headers)
        
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "total_count" in data
        
        assert data["total_count"] >= 1
        item = data["items"][0]
        
        assert item["patient_name"] == "Audit Patient"
        assert item["doctor_name"] == "Dr. Audit"
        assert item["uuid"] == "uuid-audit-123"
        assert item["email_sent_at"] is not None
