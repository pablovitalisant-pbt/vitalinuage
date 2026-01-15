
import pytest
from backend.models import User, Patient, ClinicalConsultation
from backend.auth import create_access_token
from fastapi.testclient import TestClient
from backend.main import app
import uuid

# Initialize Client
client = TestClient(app)

def test_delete_account_incorrect_phrase(db_session):
    """
    Scenario: User tries to delete account with empty or wrong phrase.
    Expected: 422 for format or 400 for logic error.
    """
    # 1. Setup User
    email = f"delete_fail_{uuid.uuid4()}@test.com"
    user = User(email=email, hashed_password="hashed", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    token = create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Attempt Delete with WRONG phrase
    payload = {"confirmation_phrase": "wrong phrase"}
    response = client.request("DELETE", "/api/users/me", headers=headers, json=payload)
    
    # 3. Assert Failure
    # Expect 400 Bad Request because phrase is wrong
    assert response.status_code == 400, f"Expected 400 Bad Request, got {response.status_code}"

def test_delete_account_cascade_success(db_session):
    """
    Scenario: User deletes account with CORRECT phrase.
    Expected: 200 OK. Patient and Consultation count for this user = 0.
    """
    # 1. Setup Data
    email = f"delete_success_{uuid.uuid4()}@test.com"
    user = User(email=email, hashed_password="hashed", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    # Add Patient
    patient = Patient(
        nombre="Dead", apellido_paterno="Pool", dni="999", 
        fecha_nacimiento="1990-01-01", owner_id=email
    )
    db_session.add(patient)
    db_session.commit()
    
    # Add Consultation
    cons = ClinicalConsultation(
        patient_id=patient.id, owner_id=email, 
        motivo_consulta="Bye", diagnostico="Gone", plan_tratamiento="None"
    )
    db_session.add(cons)
    db_session.commit()
    
    token = create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Attempt Delete with CORRECT phrase
    phrase = f"eliminar mi cuenta vitalinuage/{email}"
    payload = {"confirmation_phrase": phrase}
    
    response = client.request("DELETE", "/api/users/me", headers=headers, json=payload)
    
    # 3. Assert Success (This will FAIL/RED because endpoint missing or logic missing)
    # Ideally we assert 200, but in Red phase it will be 404.
    # To make it a useful Red Test for development, we write what we WANT (200).
    assert response.status_code == 200
    
    # 4. Assert DB Cleanup
    p_count = db_session.query(Patient).filter(Patient.owner_id == email).count()
    c_count = db_session.query(ClinicalConsultation).filter(ClinicalConsultation.owner_id == email).count()
    u_count = db_session.query(User).filter(User.email == email).count()
    
    assert p_count == 0
    assert c_count == 0
    assert u_count == 0
