from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User, Patient, MedicalBackground
from backend.database import SessionLocal, get_db
import pytest
import datetime

client = TestClient(app)

@pytest.fixture
def db_session_background():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_medical_background_endpoint(db_session_background):
    # 1. Setup Data
    email = "background_test@example.com"
    password = "password123"
    
    # Create User
    existing_user = db_session_background.query(User).filter(User.email == email).first()
    if existing_user:
        db_session_background.delete(existing_user)
        db_session_background.commit()

    user = User(
        email=email,
        hashed_password="hashed_password",
        professional_name="Dr. Test",
        is_verified=True,
        is_onboarded=True
    )
    db_session_background.add(user)
    db_session_background.commit()
    db_session_background.refresh(user)
    
    # Create Patient
    patient = Patient(
        nombre="Background",
        apellido_paterno="Patient",
        dni="123456789", # Added DNI as it is nullable=False
        fecha_nacimiento="1990-01-01", # Expects string
        sexo="M",
        telefono="555-5555",
        owner_id=user.email,
        email="bgpatient@example.com"
    )
    db_session_background.add(patient)
    db_session_background.commit()
    db_session_background.refresh(patient)

    # 2. Login
    # Using dependency overrideless login simulation approach or authentic headers
    # For integration test, we simulate token if auth logic is standard, or use app auth
    # To keep it simple and robust, let's use dependency override for current user if simple,
    # or just use the token endpoint.
    
    # But wait, dependency override is cleaner for unit tests.
    from backend.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        # 3. Test GET (Empty)
        response = client.get(f"/api/medical-background/pacientes/{patient.id}/antecedentes")
        assert response.status_code == 200, f"Failed GET: {response.text}"
        data = response.json()
        assert data["patient_id"] == patient.id
        assert data["alergias"] is None

        # 4. Test PUT (Update)
        payload = {
            "alergias": "Penicilina",
            "patologicos": "Hipertensión",
            "quirurgicos": "Apendicectomía"
        }
        response = client.put(f"/api/medical-background/pacientes/{patient.id}/antecedentes", json=payload)
        assert response.status_code == 200, f"Failed PUT: {response.text}"
        data = response.json()
        assert data["alergias"] == "Penicilina"
        assert data["patologicos"] == "Hipertensión"
        assert data["updated_at"] is not None

        # 5. Verify Persistence
        response = client.get(f"/api/medical-background/pacientes/{patient.id}/antecedentes")
        data = response.json()
        assert data["alergias"] == "Penicilina"

    finally:
        app.dependency_overrides = {}
        # Cleanup
        db_session_background.query(MedicalBackground).filter(MedicalBackground.patient_id == patient.id).delete()
        db_session_background.delete(patient)
        db_session_background.delete(user)
        db_session_background.commit()
