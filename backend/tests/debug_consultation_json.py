from fastapi.testclient import TestClient
import sys
import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.main import app
from backend.database import get_db, Base
import backend.models as models
import backend.auth as auth

# Setup Test Database - In-Memory SQLite
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

def setup_and_dump_json():
    # Create tables
    Base.metadata.create_all(bind=engine_test)
    
    db = TestingSessionLocal()
    
    # 1. Setup Auth
    email = "debug_doc@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db.add(user)
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Create Patient
    patient = models.Patient(
        nombre="Juan",
        apellido_paterno="Pérez",
        dni="12345678",
        fecha_nacimiento="1990-01-15",
        owner_id=email,
        sexo="M"
    )
    db.add(patient)
    db.commit()
    
    # 3. Create Consultation
    consultation = models.ClinicalConsultation(
        patient_id=patient.id,
        owner_id=email,
        motivo_consulta="Dolor de cabeza",
        diagnostico="Cefalea tensional",
        plan_tratamiento="Paracetamol 500mg",
        examen_fisico="Paciente lúcido",
        created_at=datetime.utcnow()
    )
    db.add(consultation)
    db.commit()
    
    consultation_id = consultation.id
    patient_id = patient.id
    db.close()
    
    client = TestClient(app)
    
    # 4. Fetch Consultations
    print(f"\nDEBUG: Fetching consultations for patient {patient_id}...")
    response = client.get(f"/api/patients/{patient_id}/consultations", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("\nDEBUG: JSON OUTPUT START")
        print(json.dumps(data, indent=2))
        print("DEBUG: JSON OUTPUT END\n")
        
        # Check first item keys
        if data:
            item = data[0]
            print(f"DEBUG: Found keys: {list(item.keys())}")
    else:
        print(f"DEBUG: Failed with {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    setup_and_dump_json()
