import sys
import os
# Ensure backend is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base
from backend from backend import models
import uuid
from datetime import datetime
from main import app, get_db
import auth


# Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine_test)
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()
    Base.metadata.drop_all(bind=engine_test)

@pytest.fixture
def test_doctor(db_session):
    """Create a test doctor user"""
    doctor = models.User(
        email=f"test_doctor_{uuid.uuid4()}@vital.com",
        hashed_password="test_hash",
        is_verified=True,
        professional_name="Dr. Test WhatsApp",
        specialty="Medicina General",
        registration_number="12345"
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(doctor)
    return doctor

@pytest.fixture
def test_patient(db_session, test_doctor):
    """Create a test patient"""
    patient = models.Patient(
        nombre="Juan",
        apellido_paterno="Pérez",
        apellido_materno="García",
        dni="12345678",
        fecha_nacimiento=datetime(1990, 1, 1),
        sexo="M",
        telefono="+54 9 11 1234-5678",  # With formatting
        email="juan@test.com",
        direccion="Calle Test 123",
        owner_id=test_doctor.email
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return patient

@pytest.fixture
def test_consultation(db_session, test_doctor, test_patient):
    """Create a test clinical consultation"""
    consultation = models.ClinicalConsultation(
        patient_id=test_patient.id,
        owner_id=test_doctor.email,
        reason="Dolor de cabeza",
        diagnosis="Cefalea tensional",
        treatment="Paracetamol 500mg cada 8 horas"
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)
    return consultation

@pytest.fixture
def test_verification(db_session, test_doctor, test_consultation):
    """Create a test prescription verification"""
    verification = models.PrescriptionVerification(
        uuid=str(uuid.uuid4()),
        consultation_id=test_consultation.id,
        doctor_email=test_doctor.email,
        doctor_name=test_doctor.professional_name,
        issue_date=datetime.utcnow()
    )
    db_session.add(verification)
    db_session.commit()
    db_session.refresh(verification)
    return verification


class TestPublicPDFEndpoint:
    """Tests for public PDF download endpoint"""
    
    def test_public_pdf_endpoint_not_found(self, db_session):
        """Test 404 for non-existent UUID"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        
        # This will fail because endpoint doesn't exist yet
        response = client.get("/v/non-existent-uuid-12345/pdf")
        
        assert response.status_code == 404
    
    def test_public_pdf_endpoint_success(self, db_session, test_verification, test_consultation):
        """Test successful PDF download without authentication"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        
        # This will fail because endpoint doesn't exist yet
        response = client.get(f"/v/{test_verification.uuid}/pdf")
        
        assert response.status_code == 200
        assert response.headers['content-type'] == 'application/pdf'
        
        # Verify it's a valid PDF
        pdf_content = response.content
        assert pdf_content[:4] == b'%PDF'
    
    def test_public_pdf_no_auth_required(self, db_session, test_verification):
        """CRITICAL: Verify PDF is accessible without Bearer token"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        
        # Call WITHOUT Authorization header
        response = client.get(f"/v/{test_verification.uuid}/pdf")
        
        # Should succeed (200) not fail with 401
        assert response.status_code == 200
        assert response.headers['content-type'] == 'application/pdf'
    
    def test_public_pdf_increments_counter(self, db_session, test_verification):
        """Test that download increments scanned_count"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        
        initial_count = test_verification.scanned_count
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        
        # Download PDF
        response = client.get(f"/v/{test_verification.uuid}/pdf")
        assert response.status_code == 200
        
        # Verify counter incremented
        db_session.refresh(test_verification)
        assert test_verification.scanned_count == initial_count + 1


class TestCreateVerificationEndpoint:
    """Tests for create verification endpoint"""
    
    def test_create_verification_endpoint_not_found(self, db_session):
        """Test 404 when endpoint doesn't exist"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        import auth
        
        # Create a doctor for auth
        doctor = models.User(
            email=f"test_{uuid.uuid4()}@vital.com",
            hashed_password="test",
            is_verified=True
        )
        db_session.add(doctor)
        db_session.commit()
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        token = auth.create_access_token(data={"sub": doctor.email})
        
        # This will fail because endpoint doesn't exist yet
        response = client.post(
            "/api/consultas/999/create-verification",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
    
    def test_create_verification_success(self, db_session, test_doctor, test_consultation):
        """Test creating verification for consultation"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        import auth
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        token = auth.create_access_token(data={"sub": test_doctor.email})
        
        response = client.post(
            f"/api/consultas/{test_consultation.id}/create-verification",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'uuid' in data
        assert len(data['uuid']) == 36  # UUID v4 format
    
    def test_create_verification_idempotent(self, db_session, test_doctor, test_consultation):
        """Test that second POST returns same UUID (idempotent)"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        import auth
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        token = auth.create_access_token(data={"sub": test_doctor.email})
        
        # First call
        response1 = client.post(
            f"/api/consultas/{test_consultation.id}/create-verification",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response1.status_code == 200
        uuid1 = response1.json()['uuid']
        
        # Second call
        response2 = client.post(
            f"/api/consultas/{test_consultation.id}/create-verification",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response2.status_code == 200
        uuid2 = response2.json()['uuid']
        
        # Should be the same UUID
        assert uuid1 == uuid2
    
    def test_create_verification_unauthorized(self, db_session, test_consultation):
        """Test 401 when no auth token provided"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        
        response = client.post(f"/api/consultas/{test_consultation.id}/create-verification")
        
        assert response.status_code == 401
    
    def test_create_verification_forbidden(self, db_session, test_consultation):
        """Test 403/404 when doctor tries to access another doctor's consultation"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        import auth
        
        # Create another doctor
        other_doctor = models.User(
            email=f"other_{uuid.uuid4()}@vital.com",
            hashed_password="test",
            is_verified=True
        )
        db_session.add(other_doctor)
        db_session.commit()
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        token = auth.create_access_token(data={"sub": other_doctor.email})
        
        response = client.post(
            f"/api/consultas/{test_consultation.id}/create-verification",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should be 404 (not found) because consultation doesn't belong to this doctor
        assert response.status_code == 404
