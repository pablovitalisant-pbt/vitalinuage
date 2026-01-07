import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.database import get_db, Base
from backend.models import User, Patient, ClinicalConsultation, PrescriptionVerification, PrescriptionVerification
import uuid
from datetime import datetime
from io import BytesIO


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
        professional_name="Dr. Test Verificación",
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
        telefono="555-1234",
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


class TestQRGeneration:
    """Unit tests for QR code generation"""
    
    def test_generate_qr_image_returns_bytes(self):
        """Test that QR generation produces valid PNG bytes"""
        # This will fail because the function doesn't exist yet
        from services.qr_service import generate_qr_image
        
        url = "https://vitalinuage.com/v/test-uuid-12345"
        qr_buffer = generate_qr_image(url, size_mm=25.0)
        
        # Verify it's a BytesIO object
        assert isinstance(qr_buffer, BytesIO)
        
        # Verify it contains PNG data
        qr_buffer.seek(0)
        png_header = qr_buffer.read(8)
        assert png_header[:4] == b'\x89PNG'  # PNG magic number
    
    def test_generate_qr_with_different_sizes(self):
        """Test QR generation with different sizes"""
        from services.qr_service import generate_qr_image
        
        url = "https://vitalinuage.com/v/test-uuid"
        
        # Test different sizes
        for size_mm in [20.0, 25.0, 30.0]:
            qr_buffer = generate_qr_image(url, size_mm=size_mm)
            assert qr_buffer is not None
            assert len(qr_buffer.getvalue()) > 0


class TestPrescriptionVerificationModel:
    """Tests for PrescriptionVerification model"""
    
    def test_create_verification_record(self, db_session, test_doctor, test_consultation):
        """Test creating a verification record"""
        # This will fail because the model doesn't exist yet
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
        
        assert verification.id is not None
        assert verification.scanned_count == 0
        assert verification.last_scanned_at is None
    
    def test_verification_uuid_is_unique(self, db_session, test_doctor, test_consultation):
        """Test that UUID is unique constraint"""
        test_uuid = str(uuid.uuid4())
        
        # Create first verification
        v1 = models.PrescriptionVerification(
            uuid=test_uuid,
            consultation_id=test_consultation.id,
            doctor_email=test_doctor.email,
            doctor_name=test_doctor.professional_name,
            issue_date=datetime.utcnow()
        )
        db_session.add(v1)
        db_session.commit()
        
        # Try to create second with same UUID (should fail)
        v2 = models.PrescriptionVerification(
            uuid=test_uuid,
            consultation_id=test_consultation.id,
            doctor_email=test_doctor.email,
            doctor_name=test_doctor.professional_name,
            issue_date=datetime.utcnow()
        )
        db_session.add(v2)
        
        with pytest.raises(Exception):  # IntegrityError
            db_session.commit()


class TestVerificationAPIEndpoint:
    """API endpoint tests for public verification"""
    
    def test_verification_endpoint_not_found(self, db_session):
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
        response = client.get("/v/non-existent-uuid-12345")
        
        assert response.status_code == 404
    
    def test_verification_endpoint_success(self, db_session, test_doctor, test_consultation):
        """Test successful verification"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        
        # Create verification record
        test_uuid = str(uuid.uuid4())
        verification = models.PrescriptionVerification(
            uuid=test_uuid,
            consultation_id=test_consultation.id,
            doctor_email=test_doctor.email,
            doctor_name=test_doctor.professional_name,
            issue_date=datetime.utcnow()
        )
        db_session.add(verification)
        db_session.commit()
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        response = client.get(f"/v/{test_uuid}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data['valid'] == True
        assert data['doctor_name'] == test_doctor.professional_name
        assert 'issue_date' in data
        assert 'verification_message' in data
    
    def test_verification_does_not_expose_patient_data(self, db_session, test_doctor, test_consultation):
        """CRITICAL: Verify patient data is NOT exposed"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        
        test_uuid = str(uuid.uuid4())
        verification = models.PrescriptionVerification(
            uuid=test_uuid,
            consultation_id=test_consultation.id,
            doctor_email=test_doctor.email,
            doctor_name=test_doctor.professional_name,
            issue_date=datetime.utcnow()
        )
        db_session.add(verification)
        db_session.commit()
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        response = client.get(f"/v/{test_uuid}")
        
        assert response.status_code == 200
        data = response.json()
        
        # CRITICAL: These fields must NOT be present
        assert 'patient_name' not in data
        assert 'patient_dni' not in data
        assert 'diagnosis' not in data
        assert 'treatment' not in data
        assert 'treatment' not in data
        assert 'diagnosis' not in data
    
    def test_scan_counter_increments(self, db_session, test_doctor, test_consultation):
        """Test that scanned_count increments on each access"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        
        test_uuid = str(uuid.uuid4())
        verification = models.PrescriptionVerification(
            uuid=test_uuid,
            consultation_id=test_consultation.id,
            doctor_email=test_doctor.email,
            doctor_name=test_doctor.professional_name,
            issue_date=datetime.utcnow()
        )
        db_session.add(verification)
        db_session.commit()
        
        initial_count = verification.scanned_count
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        
        # First scan
        response1 = client.get(f"/v/{test_uuid}")
        assert response1.status_code == 200
        
        # Second scan
        response2 = client.get(f"/v/{test_uuid}")
        assert response2.status_code == 200
        
        # Verify counter incremented
        db_session.refresh(verification)
        assert verification.scanned_count == initial_count + 2
        assert verification.last_scanned_at is not None


class TestPDFServiceQRIntegration:
    """Integration tests for QR in PDF generation"""
    
    def test_pdf_includes_qr_when_field_configured(self, db_session, test_doctor, test_consultation):
        """Test that PDF includes QR when qr_code field is in map"""
        from services.pdf_service import PDFService
        import tempfile
        
        # Create prescription map with QR field
        pmap = models.PrescriptionMap(
            doctor_id=test_doctor.email,
            name="Test Map with QR",
            canvas_width_mm=148.0,
            canvas_height_mm=210.0,
            fields_config=[
                {
                    "field_key": "qr_code",
                    "x_mm": 120.0,
                    "y_mm": 180.0,
                    "font_size_pt": 0,
                    "max_width_mm": 25.0
                }
            ]
        )
        db_session.add(pmap)
        db_session.commit()
        
        # Generate PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            pdf_bytes = PDFService.generate_with_coordinates(
                consultation=test_consultation,
                prescription_map=pmap,
                output_path=tmp.name,
                db=db_session  # Pass db session for verification creation
            )
        
        # Verify PDF was generated
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        assert pdf_bytes[:4] == b'%PDF'
        
        # Verify verification record was created
        verification = db_session.query(models.PrescriptionVerification).filter(
            models.PrescriptionVerification.consultation_id == test_consultation.id
        ).first()
        
        assert verification is not None
        assert verification.doctor_name == test_doctor.professional_name
    
    def test_pdf_without_qr_field_works(self, db_session, test_doctor, test_consultation):
        """Test that PDF without QR field still works"""
        from services.pdf_service import PDFService
        import tempfile
        
        # Create prescription map WITHOUT QR field
        pmap = models.PrescriptionMap(
            doctor_id=test_doctor.email,
            name="Test Map without QR",
            canvas_width_mm=148.0,
            canvas_height_mm=210.0,
            fields_config=[
                {
                    "field_key": "patient_name",
                    "x_mm": 20.0,
                    "y_mm": 40.0,
                    "font_size_pt": 12,
                    "max_width_mm": 80.0
                }
            ]
        )
        db_session.add(pmap)
        db_session.commit()
        
        # Generate PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            pdf_bytes = PDFService.generate_with_coordinates(
                consultation=test_consultation,
                prescription_map=pmap,
                output_path=tmp.name,
                db=db_session
            )
        
        # Verify PDF was generated
        assert pdf_bytes is not None
        assert pdf_bytes[:4] == b'%PDF'
