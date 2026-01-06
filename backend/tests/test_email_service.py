import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import pytest
from unittest.mock import Mock, patch, MagicMock
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
        professional_name="Dr. Test Email",
        specialty="Medicina General",
        registration_number="12345"
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(doctor)
    return doctor

@pytest.fixture
def test_patient_with_email(db_session, test_doctor):
    """Create a test patient with email"""
    patient = models.Patient(
        nombre="Juan",
        apellido_paterno="Pérez",
        apellido_materno="García",
        dni="12345678",
        fecha_nacimiento=datetime(1990, 1, 1),
        sexo="M",
        telefono="+54 9 11 1234-5678",
        email="juan.perez@test.com",  # WITH EMAIL
        direccion="Calle Test 123",
        owner_id=test_doctor.email
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return patient

@pytest.fixture
def test_patient_no_email(db_session, test_doctor):
    """Create a test patient WITHOUT email"""
    patient = models.Patient(
        nombre="Maria",
        apellido_paterno="Lopez",
        apellido_materno="Gomez",
        dni="87654321",
        fecha_nacimiento=datetime(1985, 5, 15),
        sexo="F",
        telefono="+54 9 11 9876-5432",
        email=None,  # NO EMAIL
        direccion="Calle Test 456",
        owner_id=test_doctor.email
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return patient

@pytest.fixture
def test_consultation_with_email(db_session, test_doctor, test_patient_with_email):
    """Create a test consultation for patient with email"""
    consultation = models.ClinicalConsultation(
        patient_id=test_patient_with_email.id,
        owner_id=test_doctor.email,
        motivo_consulta="Dolor de cabeza",
        diagnostico="Cefalea tensional",
        plan_tratamiento="Paracetamol 500mg cada 8 horas"
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)
    return consultation

@pytest.fixture
def test_consultation_no_email(db_session, test_doctor, test_patient_no_email):
    """Create a test consultation for patient without email"""
    consultation = models.ClinicalConsultation(
        patient_id=test_patient_no_email.id,
        owner_id=test_doctor.email,
        motivo_consulta="Gripe",
        diagnostico="Influenza",
        plan_tratamiento="Reposo"
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)
    return consultation


class TestEmailService:
    """Tests for EmailService with Resend"""
    
    @patch('resend.Emails.send')
    @patch.dict(os.environ, {'RESEND_API_KEY': 're_test_123'})
    def test_send_prescription_email_success(self, mock_resend_send):
        """Test successful email sending with Resend"""
        # This will fail because EmailService doesn't exist yet
        from services.email_service import EmailService
        
        # Mock Resend response
        mock_resend_send.return_value = {'id': 'email-123'}
        
        # Call service
        result = EmailService.send_prescription_email(
            to_email="patient@test.com",
            patient_name="Juan Pérez",
            doctor_name="Dr. Test Email",
            pdf_url="https://vitalinuage.com/v/test-uuid/pdf",
            issue_date="05/01/2026"
        )
        
        # Verify Resend was called
        assert result == True
        mock_resend_send.assert_called_once()
        
        # Verify call arguments
        call_args = mock_resend_send.call_args[0][0]
        assert call_args['to'] == ["patient@test.com"]
        assert call_args['subject'] == "Receta Médica - Dr. Test Email"
        assert 'html' in call_args
        assert 'https://vitalinuage.com/v/test-uuid/pdf' in call_args['html']
    
    @patch('resend.Emails.send')
    @patch.dict(os.environ, {'RESEND_API_KEY': 're_test_123'})
    def test_send_prescription_email_resend_error(self, mock_resend_send):
        """Test email sending with Resend error"""
        from services.email_service import EmailService
        
        # Mock Resend to raise error
        mock_resend_send.side_effect = Exception("Resend API error")
        
        # Call service
        result = EmailService.send_prescription_email(
            to_email="patient@test.com",
            patient_name="Juan Pérez",
            doctor_name="Dr. Test Email",
            pdf_url="https://vitalinuage.com/v/test-uuid/pdf",
            issue_date="05/01/2026"
        )
        
        # Should return False on error
        assert result == False
    
    def test_get_resend_config(self):
        """Test Resend configuration retrieval"""
        from services.email_service import EmailService
        
        # This assumes we implement a get_api_key method or similar
        # For now, just checking if we can import it
        assert hasattr(EmailService, 'get_api_key') or hasattr(EmailService, 'send_prescription_email')

    @patch('resend.Emails.send')
    @patch.dict(os.environ, {'RESEND_API_KEY': 're_test_123'})
    def test_send_email_includes_all_template_variables(self, mock_resend_send):
        """Test that email HTML includes all required variables"""
        from services.email_service import EmailService
        
        mock_resend_send.return_value = {'id': 'email-123'}
        
        EmailService.send_prescription_email(
            to_email="patient@test.com",
            patient_name="Juan Pérez",
            doctor_name="Dr. Test Email",
            pdf_url="https://vitalinuage.com/v/test-uuid-123/pdf",
            issue_date="05/01/2026"
        )
        
        # Get HTML from call
        call_args = mock_resend_send.call_args[0][0]
        html = call_args['html']
        
        # Verify all variables are in HTML
        assert "Juan Pérez" in html
        assert "Dr. Test Email" in html
        assert "https://vitalinuage.com/v/test-uuid-123/pdf" in html
        assert "05/01/2026" in html
        assert "Descargar" in html or "Download" in html

class TestEmailTemplate:
    """Tests for email template rendering"""
    
    def test_template_renders_with_variables(self):
        """Test that template includes all required variables"""
        from jinja2 import Template
        import os
        
        # This will fail because template doesn't exist yet
        template_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 
            'services', 
            'email_templates', 
            'prescription_email.html'
        )
        
        with open(template_path, 'r', encoding='utf-8') as f:
            template = Template(f.read())
        
        # Render with test data
        html = template.render(
            patient_name="Juan Pérez",
            doctor_name="Dr. Test Email",
            pdf_url="https://vitalinuage.com/v/test-uuid/pdf",
            issue_date="05/01/2026"
        )
        
        # Verify variables are in rendered HTML
        assert "Juan Pérez" in html
        assert "Dr. Test Email" in html
        assert "https://vitalinuage.com/v/test-uuid/pdf" in html
        assert "05/01/2026" in html
        assert "Descargar Receta" in html or "Descargar" in html


class TestSendEmailEndpoint:
    """Tests for send-email API endpoint"""
    
    def test_send_email_endpoint_not_found(self, db_session):
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
            "/api/consultas/999/send-email",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
    
    @patch('services.email_service.EmailService.send_prescription_email')
    def test_send_email_endpoint_success(
        self, 
        mock_send_email, 
        db_session, 
        test_doctor, 
        test_consultation_with_email
    ):
        """Test successful email queueing"""
        from fastapi.testclient import TestClient
        from main import app, get_db
        import auth
        
        # Mock email service
        mock_send_email.return_value = True
        
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        client = TestClient(app)
        token = auth.create_access_token(data={"sub": test_doctor.email})
        
        response = client.post(
            f"/api/consultas/{test_consultation_with_email.id}/send-email",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should return 200 with queued status
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'queued'
        assert 'message' in data
    
    def test_send_email_no_patient_email(
        self, 
        db_session, 
        test_doctor, 
        test_consultation_no_email
    ):
        """Test 400 when patient has no email"""
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
            f"/api/consultas/{test_consultation_no_email.id}/send-email",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should return 400 Bad Request
        assert response.status_code == 400
        data = response.json()
        assert 'email' in data['detail'].lower()
    
    def test_send_email_unauthorized(self, db_session, test_consultation_with_email):
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
        
        response = client.post(
            f"/api/consultas/{test_consultation_with_email.id}/send-email"
        )
        
        assert response.status_code == 401
