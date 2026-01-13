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
from unittest.mock import patch, MagicMock

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
        professional_name="Dr. Persistence",
        is_verified=True
    )
    db_session.add(doctor)
    
    patient = models.Patient(
        nombre="Persistence",
        apellido_paterno="Test",
        dni="99999",
        fecha_nacimiento="1990-01-01",
        email="persist@test.com",
        owner_id=doctor_email
    )
    db_session.add(patient)
    db_session.commit()
    
    consultation = models.ClinicalConsultation(
        patient_id=patient.id,
        owner_id=doctor_email,
        motivo_consulta="QR Check",
        diagnostico="Persistence Check",
        plan_tratamiento="DB Commit Verify"
    )
    db_session.add(consultation)
    db_session.commit()
    return consultation

class TestSlice32_1_Persistence:
    
    def test_verification_persistence_after_pdf_generation(self, db_session, unique_consultation):
        """
        FAILING TEST (Persistence Issue):
        1. Generate PDF.
        2. Verify UUID exists in the SAME session (sanity check).
        3. Verify UUID exists in a DIFFERENT session (Proof of Commit).
           This simulates the Public API trying to find the record in a fresh request.
        """
        from backend.services.pdf_service import PDFService
        from backend.models import PrescriptionVerification
        
        # We assume WeasyPrint works or we mock it to avoid failures there
        with patch('weasyprint.HTML') as mock_html:
            mock_html.return_value.write_pdf.return_value = b'%PDF-MOCK'
            
            # Execute Generation
            PDFService.generate_prescription_pdf(
                consultation=unique_consultation,
                doctor_email=unique_consultation.owner_id,
                db=db_session
            )
            
            # 1. Check in same session (Sanity)
            # db_session.expire_all()
            verification_local = db_session.query(PrescriptionVerification).filter_by(
                consultation_id=unique_consultation.id
            ).first()
            assert verification_local is not None, "Record missing in local session"
            generated_uuid = verification_local.uuid

            # 2. Check in SEPARATE session (Public API Simulation)
            # Use the global TestingSessionLocal to create a new session binding to the same engine
            # Since we use StaticPool, the data persists in memory as long as engine is alive.
            
            # NOTE: We must ensure the 'db_session' transaction didn't hold a lock or wasn't just a flush.
            # If pdf_service called commit(), it should be visible.
            
            session2 = TestingSessionLocal()
            try:
                verification_public = session2.query(PrescriptionVerification).filter_by(
                    uuid=generated_uuid
                ).first()
                
                # THIS IS WHERE IT MIGHT FAIL if commit didn't happen
                assert verification_public is not None, f"Ghost PDF! UUID {generated_uuid} found in local session but NOT visible to Public API session."
            finally:
                session2.close()

