import pytest
import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_create_patient_with_owner_id_persistence():
    """
    Multitenancy Requirement:
    Verify that when we send an 'owner_id', it is persisted and returned.
    Fails if the backend schema or DB model lacks the field.
    """
    owner_id = str(uuid.uuid4())
    payload = {
        "nombre": "TestMultitenant",
        "apellido_paterno": "Patient",
        "dni": f"DNI-{owner_id[:8]}", # Unique DNI
        "fecha_nacimiento": "1990-01-01",
        "sexo": "M",
        "owner_id": owner_id # <--- NEW FIELD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/pacientes", json=payload, timeout=5)
        
        # If the endpoint doesn't exist or crashes, fail gracefully
        if response.status_code not in [200, 201]:
             pytest.fail(f"API Error. Status: {response.status_code}, Body: {response.text}")

        data = response.json()
        
        # RED TEST ASSERTION: This should fail because 'owner_id' is not yet in the response
        assert "owner_id" in data, "Response should contain owner_id"
        assert data["owner_id"] == owner_id, f"Expected owner_id {owner_id}, got {data.get('owner_id')}"
        
    except requests.exceptions.ConnectionError:
        pytest.fail("Server is not running. Start it with 'uvicorn backend.main:app --reload'")
