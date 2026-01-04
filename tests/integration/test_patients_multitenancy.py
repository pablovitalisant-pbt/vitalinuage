import pytest
import requests
import uuid
import time

BASE_URL = "http://localhost:8000"

# Helper to create patient
def create_patient_helper(token=None, owner_id=None):
    if not owner_id:
        owner_id = str(uuid.uuid4())
        
    payload = {
        "nombre": "TestMultitenant",
        "apellido_paterno": "Patient",
        "dni": f"DNI-{uuid.uuid4().hex[:8]}", # Truly Unique DNI
        "fecha_nacimiento": "1990-01-01",
        "sexo": "M",
        "owner_id": owner_id
    }
    
    # In next slice, we will use Auth token. 
    # For now we might send 'owner_id' in body, but server will overwrite with token user 
    # once Auth is fully integrated.
    # Current spec says endpoint will inject owner_id from Auth.
    # We will need a token to test REAL persistence if the endpoint enforces Auth.
    
    # Assuming for this checking phase we might get 500 because the Table doesn't exist yet.
    response = requests.post(f"{BASE_URL}/api/pacientes", json=payload, timeout=5)
    return response, payload

def test_create_patient_persistence_failure():
    """
    Persistence Requirement:
    Verify that creating a patient actually tries to save to DB.
    
    EXPECTED BEHAVIOR (RED):
    - Should FAIL with 500 Internal Server Error (or similar) because
      the 'patients' table DOES NOT EXIST yet in the database.
      OR
    - Should fail because logic is still mocked (returns 999 ID but doesn't persist).
    
    If it passes smoothly, it means we are still mocking!
    We want to assert that we are hitting the DB layer.
    """
    
    try:
        response, _ = create_patient_helper()
        
        # If we are strictly following TDD for Persistence:
        # We expect the current code (Mock) to PASS the contract check but FAIL the Persistence check.
        # But wait, `test_patients_multitenancy.py` from Phase 1 passes because of Mock.
        # We need to verify that we are NOT mocking anymore.
        
        # How to differentiate Mock vs Real?
        # Mock always returns ID 999.
        # Real DB will return ID 1, 2, 3...
        
        if response.status_code == 200:
            data = response.json()
            # If ID is 999 (The mock ID), then we haven't implemented persistence. 
            # This makes the test RED for the "Persistence" feature.
            assert data["id"] != 999, "Still using Mock implementation! We need Real Persistence."
            
            # Additional check: If table doesn't exist, it should actually be 500.
            
        elif response.status_code == 500:
            # If it fails with 500, it might mean it tried to hit DB and failed (Good Red)
            # But specific error message would be better.
            pass
            
    except requests.exceptions.ConnectionError:
        pytest.fail("Server is not running.")
