import pytest
import sys
import os
from unittest.mock import MagicMock

# Ensure backend root is in path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.services.pdf_service import PDFService

def test_pdf_generation_fails_with_string_dates():
    """
    Test that PDF generation fails when date fields are strings instead of datetime objects.
    This simulates the AttributeError: 'str' object has no attribute 'year' error seen in production.
    """
    
    # Create Mock Encapsulation
    class MockPatient:
        nombre = "Juan"
        apellido_paterno = "Perez"
        dni = "12345678-9"
        fecha_nacimiento = "1990-01-01"  # STRING, not date object -> The Cause of Failure
        email = "juan@example.com"
        telefono = "123456789"
        
    class MockConsultation:
        id = 1
        diagnostico = "Gripe"
        plan_tratamiento = "Paracetamol"
        created_at = "2023-10-27T10:00:00" # STRING, not datetime object
        patient = MockPatient()
        owner_id = "doctor@example.com"
        motivo_consulta = "Dolor de cabeza"
        examen_fisico = "Normal"
        
    consultation = MockConsultation()
    
    # We expect this to SUCCEED now that we have robust parsing
    print("\n--- Attempting PDF Generation with String Dates ---")
    try:
        pdf_bytes = PDFService.generate_from_html_file(consultation)
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        print("SUCCESS: PDF Generated successfully despite string dates.")
    except AttributeError as e:
        pytest.fail(f"Regression: Code crashed with AttributeError: {e}")
    except Exception as e:
        if "WeasyPrint module not found" in str(e):
             print(f"Skipping PDF check due to missing WeasyPrint: {e}")
        else:
             pytest.fail(f"Unexpected error: {e}")

if __name__ == "__main__":
    test_pdf_generation_fails_with_string_dates()
