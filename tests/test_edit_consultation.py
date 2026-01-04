import requests
import uuid
from backend.database import SessionLocal, engine
from backend.models import Base, Patient, Consultation
from datetime import datetime, date

# Reset DB for test isolation (cleaner to use a fixture but this works for slice script)
Base.metadata.create_all(bind=engine)

BASE_URL = "http://127.0.0.1:8000"

def test_edit_consultation_flow():
    # 1. Setup Data directly in DB to save time/ensure state
    db = SessionLocal()
    patient_id = str(uuid.uuid4())
    consultation_id = str(uuid.uuid4())
    
    # Create Patient
    patient = Patient(
        id=patient_id,
        nombre="TestEdit",
        apellido_paterno="Patient",
        dni=f"DNI-{uuid.uuid4()}",
        fecha_nacimiento=date(1990, 1, 1),
        sexo="M",
        fecha_registro=date.today()
    )
    db.add(patient)
    
    # Create Consultation
    consultation = Consultation(
        id=consultation_id,
        patient_id=patient_id,
        reason="Initial Reason",
        notes="Initial Notes",
        diagnosis="Initial Diagnosis",
        treatment="Initial Treatment",
        doctor_name="Dr. Test",
        doctor_address="123 Test St",
        created_at=datetime.now()
    )
    db.add(consultation)
    db.commit()
    db.close()
    
    # 2. Verify Initial State via API
    resp = requests.get(f"{BASE_URL}/api/consultations/{consultation_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["treatment"] == "Initial Treatment"
    
    # 3. Perform Update (PUT)
    update_payload = {
        "treatment": "Updated Treatment Plan",
        "notes": "Updated Notes with more details"
    }
    
    resp_update = requests.put(f"{BASE_URL}/api/consultations/{consultation_id}", json=update_payload)
    assert resp_update.status_code == 200
    updated_data = resp_update.json()
    assert updated_data["treatment"] == "Updated Treatment Plan"
    
    # 4. Verify Persistence
    resp_final = requests.get(f"{BASE_URL}/api/consultations/{consultation_id}")
    assert resp_final.status_code == 200
    final_data = resp_final.json()
    assert final_data["treatment"] == "Updated Treatment Plan"
    assert final_data["notes"] == "Updated Notes with more details"
    assert final_data["reason"] == "Initial Reason" # Should remain unchanged
