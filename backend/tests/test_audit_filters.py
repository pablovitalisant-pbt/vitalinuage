import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from models import User, Patient, ClinicalConsultation, PrescriptionVerification
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import auth
from unittest.mock import patch

# --- Fixtures Reuse (Could be moved to conftest.py in future) ---

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
    token = auth.create_access_token(data={"sub": "audit_tester@test.com"})
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
def setup_filter_data(db_session):
    # Create User
    user = User(
        email="audit_tester@test.com", 
        hashed_password="pw", 
        professional_name="Dr. Tester",
        is_verified=True
    )
    db_session.add(user)
    
    # Create Patient
    patient = Patient(
        nombre="Filter", 
        apellido_paterno="Test", 
        dni="111", 
        email="filter@test.com",
        owner_id="audit_tester@test.com",
        fecha_nacimiento="1990-01-01"
    )
    db_session.add(patient)
    db_session.commit()
    
    # Create Consultation
    consultation = ClinicalConsultation(
        patient_id=patient.id,
        owner_id="audit_tester@test.com",
        reason="Filter Test",
        diagnosis="Filter Test",
        treatment="Test"
    )
    db_session.add(consultation)
    db_session.commit()
    
    # 1. Old Sent Record (Jan 1, 2023)
    v1 = PrescriptionVerification(
        uuid="uuid-old-sent",
        consultation_id=consultation.id,
        doctor_email="audit_tester@test.com",
        doctor_name="Dr. Tester",
        issue_date=datetime(2023, 1, 1, 10, 0, 0),
        email_sent_at=datetime(2023, 1, 1, 10, 5, 0),
        whatsapp_sent_at=None
    )
    
    # 2. Recent Pending Record (Today)
    v2 = PrescriptionVerification(
        uuid="uuid-recent-pending",
        consultation_id=consultation.id,
        doctor_email="audit_tester@test.com",
        doctor_name="Dr. Tester",
        issue_date=datetime.now(),
        email_sent_at=None,
        whatsapp_sent_at=None
    )
    
    # 3. Recent Sent Record (Today)
    v3 = PrescriptionVerification(
        uuid="uuid-recent-sent",
        consultation_id=consultation.id,
        doctor_email="audit_tester@test.com",
        doctor_name="Dr. Tester",
        issue_date=datetime.now(),
        email_sent_at=datetime.now(),
        whatsapp_sent_at=datetime.now()
    )
    
    db_session.add_all([v1, v2, v3])
    db_session.commit()

class TestAuditFilters:
    
    def test_filter_date_range(self, client, db_session, auth_headers, setup_filter_data):
        """
        Verify that filtering by date range works.
        """
        # Filter for 2023 only
        params = {
            "start_date": "2023-01-01T00:00:00",
            "end_date": "2023-01-02T00:00:00"
        }
        with patch('api.audit.check_audit_flag'):
            res = client.get("/api/audit/dispatch-summary", headers=auth_headers, params=params)
            
        assert res.status_code == 200
        data = res.json()
        
        # Should only find the old record
        assert data["total_count"] == 1
        assert data["items"][0]["uuid"] == "uuid-old-sent"
        
    def test_filter_status_pending(self, client, db_session, auth_headers, setup_filter_data):
        """
        Verify that filtering by status='pending' works.
        """
        params = {"status": "pending"}
        with patch('api.audit.check_audit_flag'):
            res = client.get("/api/audit/dispatch-summary", headers=auth_headers, params=params)
            
        assert res.status_code == 200
        data = res.json()
        
        # Should only find the recent pending record
        assert data["total_count"] == 1
        assert data["items"][0]["uuid"] == "uuid-recent-pending"
        
    def test_filter_status_sent(self, client, db_session, auth_headers, setup_filter_data):
        """
        Verify that filtering by status='sent' works.
        """
        params = {"status": "sent"}
        with patch('api.audit.check_audit_flag'):
            res = client.get("/api/audit/dispatch-summary", headers=auth_headers, params=params)
            
        assert res.status_code == 200
        data = res.json()
        
        # Should find both sent records (v1 and v3)
        assert data["total_count"] == 2
        uuids = [item["uuid"] for item in data["items"]]
        assert "uuid-old-sent" in uuids
        assert "uuid-recent-sent" in uuids
