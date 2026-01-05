from fastapi.testclient import TestClient
import uuid
import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from main import app
from database import get_db, Base
import auth

auth.SECRET_KEY = "test_secret_key_fixed_for_consistency"

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine_test)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine_test)

@pytest.fixture(scope="function")
def db_session():
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

def test_create_consultation_security(client, db_session):
    # 1. Setup Auth (Doctor A)
    import auth
    from models import User, Patient
    email_a = f"doc_a_{uuid.uuid4()}@vital.com"
    user_a = User(email=email_a, hashed_password="pw", is_verified=True)
    db_session.add(user_a)
    
    # Doctor B
    email_b = f"doc_b_{uuid.uuid4()}@vital.com"
    user_b = User(email=email_b, hashed_password="pw", is_verified=True)
    db_session.add(user_b)
    db_session.commit()

    # Patient of B
    patient_b = Patient(
        nombre="Priv2", apellido_paterno="Test", dni=f"P-{uuid.uuid4()}",
        fecha_nacimiento="1990-01-01", owner_id=email_b
    )
    db_session.add(patient_b)
    db_session.commit()

    # Login as A
    token = auth.create_access_token(data={"sub": email_a})
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Try to create consultation for Patient B
    payload = {
        "motivo_consulta": "Robo de datos",
        "diagnostico": "Hacker",
        "plan_tratamiento": "Ban"
    }
    response = client.post(f"/api/pacientes/{patient_b.id}/consultas", json=payload, headers=headers)
    
    # Expect 404 (Patient not found for A) or 403
    # If endpoint doesn't exist, it returns 404, which is technically "pass" for status code check if we allow 404.
    # To ensure it's "Red" because of missing logic/models, we can start with asserting 404 but ensure validation msg?
    # Actually, user requirement: "Verificar que al enviar una consulta a un paciente que NO pertenece al médico autenticado, el sistema devuelva 403 Forbidden o 404 Not Found."
    # If I just assert 404, it might pass because API missing. 
    # But checking for a specific error detail "Patient not found" vs "Not Found" (generic route missing) is better.
    # Standard route missing: {"detail": "Not Found"}
    # Our logic usually returns: {"detail": "Patient not found"}
    assert response.status_code in [403, 404]
    if response.status_code == 404:
        assert response.json().get("detail") == "Patient not found"

def test_list_consultations_ordering(client, db_session):
    # 1. Setup Auth (Doctor Me)
    import auth
    from models import User, Patient
    email = f"doc_ord_{uuid.uuid4()}@vital.com"
    user = User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()

    patient = Patient(
        nombre="Ord", apellido_paterno="Test", dni=f"O-{uuid.uuid4()}",
        fecha_nacimiento="1990-01-01", owner_id=email
    )
    db_session.add(patient)
    db_session.commit()

    token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create 2 Consultations (Old, New)
    # We can't create them via API if it doesn't exist.
    # In Red phase, we try to call POST.
    
    c1 = {
        "motivo_consulta": "Old",
        "diagnostico": "D1",
        "plan_tratamiento": "P1"
    }
    client.post(f"/api/pacientes/{patient.id}/consultas", json=c1, headers=headers)
    
    c2 = {
        "motivo_consulta": "New",
        "diagnostico": "D2",
        "plan_tratamiento": "P2"
    }
    client.post(f"/api/pacientes/{patient.id}/consultas", json=c2, headers=headers)

    # 3. List
    response = client.get(f"/api/pacientes/{patient.id}/consultas", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Expect New then Old (Desc)
    assert data[0]["motivo_consulta"] == "New"
    assert data[1]["motivo_consulta"] == "Old"

def test_create_schema_validation(client, db_session):
    # Setup Auth
    import auth
    from models import User, Patient
    email = f"doc_inv_{uuid.uuid4()}@vital.com"
    user = User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()

    patient = Patient(
        nombre="Inv", apellido_paterno="Test", dni=f"I-{uuid.uuid4()}",
        fecha_nacimiento="1990-01-01", owner_id=email
    )
    db_session.add(patient)
    db_session.commit()

    token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}

    # Missing fields
    payload = {
        "motivo_consulta": "Just reason"
        # missing diagnosed/plan
    }
    response = client.post(f"/api/pacientes/{patient.id}/consultas", json=payload, headers=headers)
    assert response.status_code == 422
