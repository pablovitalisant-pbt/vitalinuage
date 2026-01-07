
import pytest
from fastapi.testclient import TestClient
from main import app
from schemas.patient import ClinicalRecord, ConsultationCreate

client = TestClient(app)

def test_security_headers():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    # assert response.headers["X-XSS-Protection"] == "1; mode=block" # Optional, modern browsers ignore it

def test_sanitization_xss_consultation():
    """
    Test that malicious scripts in input fields are sanitized (stripped or escaped).
    We expect the logic in Phase C to strip the tags.
    """
    malicious_input = "<script>alert('xss')</script> Healthy"
    
    # We test the schema validation directly to isolate unit logic 
    # (assuming validator runs on model creation)
    
    data = {
        "reason": malicious_input,
        "diagnosis": "<b>Bold</b>",
        "treatment": "Normal",
        "notes": "   Trim me   "
    }
    
    model = ConsultationCreate(**data)
    
    # In Phase B (Red), we expect this to FAIL if implementation is just 'strip()'.
    # If the current implementation is 'strip()', it won't remove <script> yet.
    # So we assert that it DOES NOT contain script tags to force a failure or verify future success.
    
    # Expected behavior AFTER Phase C:
    assert "<script>" not in model.reason
    assert "alert" not in model.reason
    assert "Healthy" in model.reason
    
    # Verify Trim
    assert model.notes == "Trim me"

def test_sanitization_clinical_record():
    data = {
        "allergies": ["<img src=x onerror=alert(1)>", " Peanut "], 
        "chronic_conditions": [],
        "current_medications": []
    }
    
    model = ClinicalRecord(**data)
    
    assert "<img" not in model.allergies[0]
    assert model.allergies[1] == "Peanut"
