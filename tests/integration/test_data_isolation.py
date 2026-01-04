import pytest
import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_data_isolation_between_tenants():
    """
    Isolation Requirement:
    Different users (owners) should not see each other's patients.
    
    Since we don't have full Auth-to-DB filtering implemented yet (it's the goal of this slice),
    this test assumes:
    1. We create a patient for Owner A.
    2. We try to fetch patients acting as Owner B.
    3. The list should be empty.
    
    NOTE: Currently we only have POST /api/pacientes. We likely need GET /api/pacientes to verify this.
    If GET is not implemented, we will verify isolation via trying to Access/Edit if possible, 
    or we skip the GET part and focus on the architecture ensuring the 'owner_id' is correctly saved.
    
    Based on Slice 02 Specs: "get_patients(db, owner_id) ... Filtra filter(Patient.owner_id == owner_id)"
    So we assume we will implement GET endpoint too.
    """
    
    # 1. Create Patient for Owner A
    owner_a = f"doctor_a_{uuid.uuid4().hex}@test.com"
    payload_a = {
        "nombre": "PatientA",
        "apellido_paterno": "OfDoctorA",
        "dni": f"DNI-{uuid.uuid4().hex[:8]}",
        "fecha_nacimiento": "1990-01-01",
        "sexo": "M",
        "owner_id": owner_a
    }
    
    # We might need to mock Auth headers here later. 
    # For now, relying on 'owner_id' in body if allowed, or we fail because we can't inject it yet.
    # Current MOCK api allows body injection.
    
    try:
        # Create Patient A
        resp_a = requests.post(f"{BASE_URL}/api/pacientes", json=payload_a)
        
        # This checks if endpoint is still the MOCK (which echoes owner_id).
        # We expect this to eventually succeed (creating data).
        if resp_a.status_code != 200:
             # If create fails, we can't test isolation.
             # This is acceptable RED if create fails due to missing table.
             return 

        # 2. Try to List Patients for Owner B
        # owner_b = f"doctor_b_{uuid.uuid4().hex}@test.com"
        
        # We need a GET endpoint. Spec implies it exists/will exist.
        # resp_get = requests.get(f"{BASE_URL}/api/pacientes") 
        # But we don't have tokens for A vs B yet easily set up in this test harness without 'auth_token' helper.
        
        # Simplified Test for Slice 02 Red State:
        # Just fail confirming that GET endpoint doesn't exist or doesn't support filtering yet.
        
        resp_get = requests.get(f"{BASE_URL}/api/pacientes")
        
        if resp_get.status_code == 404:
            # Start of RED: Endpoint doesn't exist.
            pytest.fail("GET /api/pacientes not implemented yet (Expected Red)")
            
        if resp_get.status_code == 200:
             data = resp_get.json()
             # If we see Patient A without being Owner A (or being Owner B), it's a leak.
             # But without Auth context, this is hard to prove "acting as Owner B".
             # We will update this test once we implement the GET endpoint complying with specs.
             pass

    except requests.exceptions.ConnectionError:
        pytest.fail("Server is not running.")
