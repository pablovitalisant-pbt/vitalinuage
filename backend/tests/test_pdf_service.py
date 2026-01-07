import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base
import models
import uuid
from datetime import datetime

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
        professional_name="Dr. Tester",
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
        owner_id=test_doctor.email  # Changed from doctor_id to owner_id
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
        owner_id=test_doctor.email,  # Changed from doctor_id to owner_id
        reason="Dolor de cabeza",
        diagnosis="Cefalea tensional",
        treatment="Paracetamol 500mg cada 8 horas"
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)
    return consultation

@pytest.fixture
def test_prescription_map(db_session, test_doctor):
    """Create a test prescription map"""
    pmap = models.PrescriptionMap(
        doctor_id=test_doctor.email,
        name="Test Map",
        canvas_width_mm=148.0,
        canvas_height_mm=210.0,
        fields_config=[
            {
                "field_key": "patient_name",
                "x_mm": 20.0,
                "y_mm": 40.0,
                "font_size_pt": 12,
                "max_width_mm": 80.0
            },
            {
                "field_key": "diagnosis",
                "x_mm": 20.0,
                "y_mm": 60.0,
                "font_size_pt": 10,
                "max_width_mm": 110.0
            }
        ]
    )
    db_session.add(pmap)
    db_session.commit()
    db_session.refresh(pmap)
    return pmap


class TestPDFServiceUnit:
    """Unit tests for PDFService utility functions"""
    
    def test_mm_to_points_conversion(self):
        """Test that mm to points conversion is accurate"""
        # This will fail because PDFService doesn't exist yet
        from services.pdf_service import PDFService
        
        # 1mm = 2.83465 points (PDF standard)
        assert PDFService.mm_to_points(1.0) == pytest.approx(2.83465, rel=1e-5)
        assert PDFService.mm_to_points(10.0) == pytest.approx(28.3465, rel=1e-5)
        assert PDFService.mm_to_points(148.0) == pytest.approx(419.528, rel=1e-3)  # A5 width
        assert PDFService.mm_to_points(210.0) == pytest.approx(595.276, rel=1e-3)  # A5 height
    
    def test_extract_field_value(self, db_session, test_consultation):
        """Test field value extraction from consultation data"""
        from services.pdf_service import PDFService
        
        # Test patient_name extraction
        patient_name = PDFService.extract_field_value(test_consultation, 'patient_name')
        assert patient_name == "Juan Pérez"
        
        # Test diagnosis extraction
        diagnosis = PDFService.extract_field_value(test_consultation, 'diagnosis')
        assert diagnosis == "Cefalea tensional"
        
        # Test treatment extraction (uses treatment in model)
        treatment = PDFService.extract_field_value(test_consultation, 'treatment')
        assert treatment == "Paracetamol 500mg cada 8 horas"
        
        # Test unknown field
        unknown = PDFService.extract_field_value(test_consultation, 'unknown_field')
        assert unknown == ""


class TestPDFServiceIntegration:
    """Integration tests for PDF generation strategies"""
    
    def test_get_active_map_exists(self, db_session, test_doctor, test_prescription_map):
        """Test retrieving active prescription map"""
        from services.pdf_service import PDFService
        
        active_map = PDFService.get_active_map(test_doctor.email, db_session)
        
        assert active_map is not None
        assert active_map.id == test_prescription_map.id
        assert active_map.is_active == True
    
    def test_get_active_map_not_exists(self, db_session, test_doctor):
        """Test when no active map exists"""
        from services.pdf_service import PDFService
        
        active_map = PDFService.get_active_map(test_doctor.email, db_session)
        
        assert active_map is None
    
    def test_generate_with_coordinates(self, db_session, test_consultation, test_prescription_map):
        """Test PDF generation with custom coordinates using ReportLab"""
        from services.pdf_service import PDFService
        import tempfile
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            pdf_bytes = PDFService.generate_with_coordinates(
                consultation=test_consultation,
                prescription_map=test_prescription_map,
                output_path=tmp.name
            )
        
        # Verify PDF was generated
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        assert pdf_bytes[:4] == b'%PDF'  # PDF magic number
    
    def test_generate_with_template(self, db_session, test_consultation):
        """Test PDF generation with WeasyPrint template (fallback)"""
        from services.pdf_service import PDFService
        
        pdf_bytes = PDFService.generate_with_template(
            consultation=test_consultation,
            template_id="modern"
        )
        
        # Verify PDF was generated
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        assert pdf_bytes[:4] == b'%PDF'
    
    def test_generate_prescription_pdf_with_map(self, db_session, test_doctor, test_consultation, test_prescription_map):
        """Test main method chooses ReportLab when map exists"""
        from services.pdf_service import PDFService
        
        pdf_bytes = PDFService.generate_prescription_pdf(
            consultation=test_consultation,
            doctor_email=test_doctor.email,
            db=db_session
        )
        
        assert pdf_bytes is not None
        assert pdf_bytes[:4] == b'%PDF'
    
    def test_generate_prescription_pdf_without_map(self, db_session, test_doctor, test_consultation):
        """Test main method chooses WeasyPrint when no map exists"""
        from services.pdf_service import PDFService
        
        pdf_bytes = PDFService.generate_prescription_pdf(
            consultation=test_consultation,
            doctor_email=test_doctor.email,
            db=db_session
        )
        
        assert pdf_bytes is not None
        assert pdf_bytes[:4] == b'%PDF'


class TestPDFAPIEndpoint:
    """API endpoint tests for PDF generation"""
    
    def test_pdf_endpoint_success(self, db_session, test_doctor, test_consultation):
        """Test successful PDF generation via API"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        import auth
        
        # Override DB dependency
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        token = auth.create_access_token(data={"sub": test_doctor.email})
        
        response = client.get(
            f"/api/consultas/{test_consultation.id}/pdf",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # This will fail because endpoint doesn't exist yet
        assert response.status_code == 200
        assert response.headers['content-type'] == 'application/pdf'
    
    def test_pdf_endpoint_not_found(self, db_session, test_doctor):
        """Test 404 for non-existent consultation"""
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
        
        response = client.get(
            "/api/consultas/99999/pdf",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
    
    def test_pdf_endpoint_forbidden(self, db_session, test_consultation):
        """Test 403 when doctor tries to access another doctor's consultation"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        import auth
        
        # Create another doctor
        other_doctor = models.User(
            email=f"other_doctor_{uuid.uuid4()}@vital.com",
            hashed_password="test_hash",
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
        
        response = client.get(
            f"/api/consultas/{test_consultation.id}/pdf",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should be 403 because consultation.owner_id != other_doctor.email
        assert response.status_code == 403
    
    def test_pdf_endpoint_unauthorized(self, db_session, test_consultation):
        """Test 401 when no authentication provided"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        
        response = client.get(f"/api/consultas/{test_consultation.id}/pdf")
        
        assert response.status_code == 401
