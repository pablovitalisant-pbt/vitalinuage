import pytest
import requests
import uuid

# Configuration
BASE_URL = "http://localhost:8005"

def get_unique_email(prefix="dr"):
    return f"{prefix}_{uuid.uuid4().hex[:8]}@test.com"

@pytest.fixture
def medico_a():
    email = get_unique_email("medicoA")
    password = "password123"
    # Register
    res_reg = requests.post(f"{BASE_URL}/register", json={"email": email, "password": password})
    assert res_reg.status_code == 200, f"Registration A failed: {res_reg.text}"
    
    # Login
    response = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    assert response.status_code == 200, f"Login failed for A: {response.text}"
    token = response.json().get("access_token")
    if not token:
        pytest.fail(f"Login successful but no token returned: {response.json()}")
    return {"email": email, "token": token}

@pytest.fixture
def medico_b():
    email = get_unique_email("medicoB")
    password = "password123"
    # Register
    res_reg = requests.post(f"{BASE_URL}/register", json={"email": email, "password": password})
    assert res_reg.status_code == 200, f"Registration B failed: {res_reg.text}"
    
    # Login
    response = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    assert response.status_code == 200, f"Login failed for B: {response.text}"
    token = response.json().get("access_token")
    if not token:
        pytest.fail(f"Login successful but no token returned: {response.json()}")
    return {"email": email, "token": token}

def test_full_multitenancy_flow(medico_a, medico_b):
    """
    Validates end-to-end multitenancy isolation.
    1. Medico A creates a patient.
    2. Medico A sees the patient.
    3. Medico B does NOT see the patient.
    4. Medico B creates their own patient.
    5. Medico B sees only their patient.
    """
    
    # 1. Medico A creates patient
    patient_a_data = {
        "nombre": "Paciente",
        "apellido_paterno": "De A",
        "dni": f"A{uuid.uuid4().hex[:8]}",
        "fecha_nacimiento": "1990-01-01"
    }
    headers_a = {"Authorization": f"Bearer {medico_a['token']}"}
    res_create_a = requests.post(f"{BASE_URL}/api/pacientes", json=patient_a_data, headers=headers_a)
    assert res_create_a.status_code == 200, f"Medico A failed to create patient: {res_create_a.text}"
    patient_a_id = res_create_a.json()["id"]

    # 2. Medico A lists patients
    res_list_a = requests.get(f"{BASE_URL}/api/pacientes", headers=headers_a)
    assert res_list_a.status_code == 200, f"Medico A failed to list patients: {res_list_a.text}"
    patients_a = res_list_a.json()
    assert any(p["id"] == patient_a_id for p in patients_a), "Medico A should see their patient"

    # 3. Medico B lists patients (Crucial Isolation Step)
    headers_b = {"Authorization": f"Bearer {medico_b['token']}"}
    res_list_b = requests.get(f"{BASE_URL}/api/pacientes", headers=headers_b)
    assert res_list_b.status_code == 200, f"Medico B failed to list patients: {res_list_b.text}"
    patients_b = res_list_b.json()
    
    # ASSERTION OF ISOLATION
    finding_a_in_b = any(p["id"] == patient_a_id for p in patients_b)
    assert not finding_a_in_b, "CRITICAL: Medico B can see Medico A's patient! Isolation failed."

    # 4. Medico B creates their own patient
    patient_b_data = {
        "nombre": "Paciente",
        "apellido_paterno": "De B",
        "dni": f"B{uuid.uuid4().hex[:8]}",
        "fecha_nacimiento": "1990-01-01"
    }
    res_create_b = requests.post(f"{BASE_URL}/api/pacientes", json=patient_b_data, headers=headers_b)
    assert res_create_b.status_code == 200, f"Medico B failed to create patient: {res_create_b.text}"
    patient_b_id = res_create_b.json()["id"]

    # 5. Medico B sees only their patient (or at least sees theirs)
    res_list_b_final = requests.get(f"{BASE_URL}/api/pacientes", headers=headers_b)
    patients_b_final = res_list_b_final.json()
    assert any(p["id"] == patient_b_id for p in patients_b_final)
    assert not any(p["id"] == patient_a_id for p in patients_b_final), "Medico B should still not see Medico A's patient"

    print("\n\nSUCCESS: Multitenancy Isolation Verified via E2E!")
