import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.db_core import Base
import backend.models as models
import uuid
from datetime import datetime
from unittest.mock import patch

# Setup Test Database for isolation
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
def unique_consultation(db_session):
    """Create a minimal consultation structure for PDF generation"""
    doctor_email = f"doc_{uuid.uuid4()}@vital.com"
    doctor = models.User(
        email=doctor_email,
        hashed_password="hash",
        professional_name="Dr. Slice32",
        is_verified=True
    )
    db_session.add(doctor)
    
    patient = models.Patient(
        nombre="Slice",
        apellido_paterno="ThirtyTwo",
        dni="323232",
        fecha_nacimiento="1990-01-01",
        email="slice32@test.com",
        owner_id=doctor_email
    )
    db_session.add(patient)
    db_session.commit()
    
    consultation = models.ClinicalConsultation(
        patient_id=patient.id,
        owner_id=doctor_email,
        motivo_consulta="QR Check",
        diagnostico="Hardcoded Domain Syndrome",
        plan_tratamiento="Environment Variable Injection"
    )
    db_session.add(consultation)
    db_session.commit()
    return consultation

class TestSlice32QRDomain:
    
    def test_pdf_content_analysis(self, db_session, unique_consultation):
        """
        AUDIT TEST: 
        1. Generate PDF (mocking WeasyPrint intentionally to inspect HTML inputs).
        2. Scan for 'vitalinuage.com'.
        3. Scan for 'vitalinuage.web.app'.
        """
        from backend.services.pdf_service import PDFService

        # We must verify what goes INTO the PDF engine (WeasyPrint)
        # because we cannot easily parse the binary PDF output in this restricted env without extra libs.
        # The prompt asks to "Inspect Bytes" but validating the HTML input is the closest proxy 
        # for identifying the source of the displayed text.
        
        with patch('weasyprint.HTML') as mock_html:
            mock_html.return_value.write_pdf.return_value = b'%PDF-MOCK-CONTENT'
            
            # Force environment to be EMPTY to trigger defaults
            with patch.dict(os.environ, {}, clear=True):
                 PDFService.generate_prescription_pdf(
                    consultation=unique_consultation,
                    doctor_email=unique_consultation.owner_id,
                    db=db_session
                )
            
            # Capture the HTML string passed to WeasyPrint
            args, kwargs = mock_html.call_args
            if not args and not kwargs:
                pytest.fail("WeasyPrint.HTML was never called!")
                
            html_content = kwargs.get('string') or (args[0] if args else "")
            
            # 1. Check for the incorrect domain
            if "vitalinuage.com" in html_content:
                pytest.fail("CRITICAL: Found 'vitalinuage.com' in generated HTML content!")
                
            # 2. Check for the correct domain
            if "vitalinuage.web.app" not in html_content:
                 pytest.fail("CRITICAL: Did NOT find 'vitalinuage.web.app' in generated HTML content!")

    def test_env_var_injection_failure_mode(self, db_session, unique_consultation):
        """
        VERIFICATION:
        Inject a random domain and ensure it appears. 
        If it doesn't appear, it means the code is ignoring the env var.
        """
        from backend.services.pdf_service import PDFService
        
        custom_domain = "https://audit-verify-domain.io"
        
        with patch.dict(os.environ, {"FRONTEND_URL": custom_domain}):
            with patch('weasyprint.HTML') as mock_html:
                mock_html.return_value.write_pdf.return_value = b'%PDF-MOCK'
                
                PDFService.generate_prescription_pdf(
                    consultation=unique_consultation,
                    doctor_email=unique_consultation.owner_id,
                    db=db_session
                )
                
                args, kwargs = mock_html.call_args
                html_content = kwargs.get('string') or (args[0] if args else "")
                
                # The PDF service explicitly strips http/https for the footer display
                # So we should expect the domain part to be present
                domain_part = custom_domain.replace("https://", "")
                
                if domain_part not in html_content:
                    pytest.fail(f"HTML did not contain injected domain '{domain_part}'. Code is ignoring FRONTEND_URL!")
