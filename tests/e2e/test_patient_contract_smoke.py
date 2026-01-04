import pytest
import requests

BASE_URL = "http://localhost:8000"

def test_create_patient_requires_owner_id():
    """
    Contract Validaton:
    Verify that creating a patient *without* 'owner_id' fails with 422 Unprocessable Entity.
    
    This simulates the "Contract" enforcement. Even if frontend blocks it, backend MUST reject it.
    
    Fails (Red) if the backend currently accepts the payload (200 OK) because the schema isn't updated.
    """
    # Payload valid except for missing owner_id
    payload = {
        "nombre": "TestNoOwner",
        "apellido_paterno": "Patient",
        "dni": "99999999", 
        "fecha_nacimiento": "1990-01-01",
        "sexo": "M"
        # MISSING owner_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/pacientes", json=payload, timeout=5)
        
        # RED TEST ASSERTION: We EXPECT 422 because owner_id is required. 
        # Currently it will probably return 200/201, causing this test to fail.
        assert response.status_code == 422, f"Expected 422 for missing owner_id, got {response.status_code}"
        
    except requests.exceptions.ConnectionError:
        pytest.fail("Server is not running.")
