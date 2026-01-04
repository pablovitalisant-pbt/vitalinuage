import pytest
import requests
import uuid
import time

BASE_URL = "http://localhost:8000"

def test_persistence_flow():
    # Wait for server if needed
    time.sleep(1)
    
    # 1. Create Patient
    dni = f"99{uuid.uuid4().hex[:6]}"
    patient_payload = {
        "nombre": "Pedro",
        "apellido_paterno": "Picapiedra",
        "apellido_materno": "",
        "dni": dni,
        "fecha_nacimiento": "1980-01-01",
        "sexo": "M",
        "telefono": "123456",
        "direccion": "Roca 1",
        "peso": 80.0,
        "talla": 180.0,
        "imc": 24.5
    }
    
    resp_create = requests.post(f"{BASE_URL}/api/pacientes", json=patient_payload)
    if resp_create.status_code == 503:
         pytest.skip("Feature disabled")
    assert resp_create.status_code == 201, f"Create failed: {resp_create.text}"
    patient_data = resp_create.json()
    patient_id = patient_data["id"]
    assert patient_id is not None
    assert patient_id != "pac_mock_001"
    
    # 2. Get Patient (verify persistence)
    resp_get = requests.get(f"{BASE_URL}/api/pacientes/{patient_id}")
    assert resp_get.status_code == 200
    fetched_data = resp_get.json()
    assert fetched_data["nombre"] == "Pedro"
    assert fetched_data["dni"] == dni
    
    # 3. Create Consultation
    consultation_payload = {
        "patient_id": patient_id,
        "reason": "Dolor de espalda",
        "notes": "Pesado",
        "diagnosis": "Lumbago",
        "treatment": "Reposo",
        "doctor_name": "Dr. Stone",
        "doctor_address": "Bedrock"
    }
    resp_cons = requests.post(f"{BASE_URL}/api/consultations", json=consultation_payload)
    if resp_cons.status_code == 503:
         pytest.skip("Consultation Feature disabled")
    
    assert resp_cons.status_code == 201
    cons_data = resp_cons.json()
    assert cons_data["patient_id"] == patient_id
    assert cons_data["id"] != "cons_flow_123" # Should be UUID now
