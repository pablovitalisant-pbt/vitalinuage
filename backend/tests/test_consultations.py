import pytest
from httpx import AsyncClient
from main import app
from models import Patient
import asyncio
from datetime import datetime, timezone

# 1. Test Creation (Failure)
@pytest.mark.asyncio
async def test_create_consultation_fail_not_implemented(auth_client, test_db, create_patient_fixture):
    # Setup: Create a patient first
    patient = create_patient_fixture(
        nombre="Mario", 
        apellido_paterno="Test", 
        dni="CONS-001",
        fecha_nacimiento="1980-05-20"
    )
    
    payload = {
        "reason": "Dolor de cabeza severo",
        "diagnosis": "Migraña",
        "treatment": "Ibuprofeno 400mg",
        "notes": "Paciente reporta fotofobia."
    }
    
    # Act: Try to create consultation
    response = await auth_client.post(f"/api/patients/{patient.id}/consultations", json=payload)
    
    # Assert (RED): We expect 201 in Green phase, but currently it returns 501 or 404 (if not routed)
    # The requirement says "Debe fallar porque el endpoint actualmente es un pass o no existe".
    # If we implemented it as raising 501, we verify it raises 501 here if we want to confirm RED correctly?
    # Or strict TDD: We write the test expecting 201, and it FAILS.
    
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    data = response.json()
    assert data["reason"] == payload["reason"]
    assert "id" in data

# 2. Test Listing (Persistence Failure)
@pytest.mark.asyncio
async def test_list_consultations_persistence_fail(auth_client, test_db, create_patient_fixture):
    patient = create_patient_fixture(
        nombre="Luigi", 
        apellido_paterno="Test", 
        dni="CONS-002",
        fecha_nacimiento="1982-06-25"
    )
    
    # 1. Create (this will fail based on above, but let's assume we proceed or skip)
    payload = { "reason": "Checkup", "diagnosis": "Sano" }
    create_res = await auth_client.post(f"/api/patients/{patient.id}/consultations", json=payload)
    
    # If create fails (as expected), this test stops here. 
    # But if we were checking persistence, we'd list.
    
    get_res = await auth_client.get(f"/api/patients/{patient.id}/consultations")
    assert get_res.status_code == 200
    items = get_res.json()
    
    # Assert (RED): We expect the item we 'tried' to create to be there. 
    # Since create returns 501 and does nothing, list returns empty.
    assert len(items) > 0
    assert items[0]["reason"] == "Checkup"

# 3. Security Test (Should work as 404/403 even in Red if stubbed correctly or fail if stub allows all)
@pytest.mark.asyncio
async def test_security_other_doctor_cannot_access(auth_client_2, test_db, create_patient_fixture):
    # Patient belongs to Doctor 1 (from create_patient_fixture defaults)
    patient = create_patient_fixture(
        nombre="Bowser", 
        apellido_paterno="Koopa", 
        dni="CONS-003",
        fecha_nacimiento="1950-01-01"
    )
    
    # Doctor 2 tries to access
    response = await auth_client_2.get(f"/api/patients/{patient.id}/consultations")
    
    # Assert: Should be 404 (Not Found) or 403.
    # If Stub is naive and bypasses ownership check, this might return 200 [] (RED).
    # If Stub has @user dependency but no check inside, it returns 200 [].
    # Our stub currently just returns [], so it probably returns 200 [] for anyone -> FAIL (RED).
    assert response.status_code == 404

# 4. Validation Schema Test
@pytest.mark.asyncio
async def test_create_validation_error(auth_client, test_db, create_patient_fixture):
    patient = create_patient_fixture(
        nombre="Peach", 
        apellido_paterno="Toadstool", 
        dni="CONS-004",
        fecha_nacimiento="1985-10-10"
    )
    
    # Payload missing 'reason' (required)
    payload = {
        "diagnosis": "Missing Reason"
    }
    
    response = await auth_client.post(f"/api/patients/{patient.id}/consultations", json=payload)
    
    # This might actually pass (Green) because FastAPI validation happens before function body.
    # So 422 is expected and likely to happen even with Stub 501.
    assert response.status_code == 422
