import pytest
import requests
import uuid
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Patient
from backend.database import Base

# Setup DB access for verification
SQLALCHEMY_DATABASE_URL = "sqlite:///./vitalinuage.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

BASE_URL = "http://localhost:8000"

def test_full_search_and_history_flow():
    # Wait for server
    time.sleep(1)
    
    # 1. Create unique patient
    unique_dni = f"TEST{uuid.uuid4().hex[:6]}"
    unique_name = f"SearchTarget_{uuid.uuid4().hex[:4]}"
    
    patient_payload = {
        "nombre": unique_name,
        "apellido_paterno": "FoundYou",
        "apellido_materno": "",
        "dni": unique_dni,
        "fecha_nacimiento": "1990-01-01",
        "sexo": "F",
        "telefono": "555555",
        "direccion": "Hidden Lane",
        "peso": 60.0,
        "talla": 160.0,
        "imc": 23.4
    }
    
    # Create via API
    resp_create = requests.post(f"{BASE_URL}/api/pacientes", json=patient_payload)
    if resp_create.status_code == 503:
        pytest.skip("Feature disabled")
    assert resp_create.status_code == 201
    patient_id = resp_create.json()["id"]
    
    # 2. Add Consultations via API
    cons1 = {
        "patient_id": patient_id,
        "reason": "First Visit",
        "notes": "Note 1",
        "diagnosis": "Diag 1",
        "treatment": "Treat 1",
        "doctor_name": "Dr. Test",
        "doctor_address": "Test"
    }
    requests.post(f"{BASE_URL}/api/consultations", json=cons1)
    
    time.sleep(0.1) # Ensure ordering by time
    
    cons2 = {
        "patient_id": patient_id,
        "reason": "Second Visit",
        "notes": "Note 2",
        "diagnosis": "Diag 2",
        "treatment": "Treat 2",
        "doctor_name": "Dr. Test",
        "doctor_address": "Test"
    }
    requests.post(f"{BASE_URL}/api/consultations", json=cons2)
    
    # 3. Test Search (Target Slice Requirement)
    # Search by Name
    resp_search = requests.get(f"{BASE_URL}/api/pacientes/search", params={"q": unique_name})
    assert resp_search.status_code == 200, f"Search failed: {resp_search.text}"
    results = resp_search.json()["results"]
    assert len(results) >= 1
    found = next((r for r in results if r["dni"] == unique_dni), None)
    assert found is not None, "Created patient not found in search results"
    assert found["id"] == patient_id

    # Search by DNI
    resp_search_dni = requests.get(f"{BASE_URL}/api/pacientes/search", params={"q": unique_dni})
    assert len(resp_search_dni.json()["results"]) >= 1

    # 4. Test History Endpoint (Target Slice Requirement)
    resp_history = requests.get(f"{BASE_URL}/api/patients/{patient_id}/consultations")
    assert resp_history.status_code == 200
    history = resp_history.json()
    assert len(history) == 2
    
    # Verification of Order (Desc)
    assert history[0]["reason"] == "Second Visit"
    assert history[1]["reason"] == "First Visit"
