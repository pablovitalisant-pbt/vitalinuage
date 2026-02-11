import json

from fastapi.testclient import TestClient

from backend import models
from backend.dependencies import get_current_user
from backend.main import app


client = TestClient(app)
SNAPSHOT_MARKER = "[ANTECEDENTES_SNAPSHOT_V1]"


def test_snapshot_and_medical_background_upsert(db_session):
    user = models.User(email="snapshot_doctor@example.com", hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    patient = models.Patient(
        nombre="Ana",
        apellido_paterno="Lopez",
        dni="SNAP-001",
        fecha_nacimiento="1990-01-01",
        sexo="F",
        owner_id=user.email,
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)

    payload = {
        "reason": "Control",
        "diagnosis": "Dx",
        "treatment": "Tx",
        "notes": "Exploracion basal",
        "alergias": "Penicilina",
        "patologicos": "Hipertension",
        "no_patologicos": "Sedentarismo",
        "heredofamiliares": "DM2 madre",
        "quirurgicos": "Apendicectomia",
        "medicamentos_actuales": "Losartan",
    }

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        res = client.post(f"/api/patients/{patient.id}/consultations", json=payload)
    finally:
        app.dependency_overrides = {}

    assert res.status_code == 201, res.text

    consultation = (
        db_session.query(models.ClinicalConsultation)
        .filter(models.ClinicalConsultation.patient_id == patient.id)
        .first()
    )
    assert consultation is not None
    assert SNAPSHOT_MARKER in (consultation.examen_fisico or "")

    snapshot_json = consultation.examen_fisico.split(SNAPSHOT_MARKER, 1)[1]
    snapshot_data = json.loads(snapshot_json)
    assert snapshot_data["alergias"] == "Penicilina"
    assert snapshot_data["patologicos"] == "Hipertension"
    assert snapshot_data["no_patologicos"] == "Sedentarismo"
    assert snapshot_data["heredofamiliares"] == "DM2 madre"
    assert snapshot_data["quirurgicos"] == "Apendicectomia"
    assert snapshot_data["medicamentos_actuales"] == "Losartan"

    background = (
        db_session.query(models.MedicalBackground)
        .filter(models.MedicalBackground.patient_id == patient.id)
        .first()
    )
    assert background is not None
    assert background.alergias == "Penicilina"
    assert background.patologicos == "Hipertension"
    assert background.no_patologicos == "Sedentarismo"
    assert background.heredofamiliares == "DM2 madre"
    assert background.quirurgicos == "Apendicectomia"
    assert background.medicamentos_actuales == "Losartan"


def test_legacy_request_without_antecedentes_keeps_examen_fisico_clean(db_session):
    user = models.User(email="legacy_doctor@example.com", hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    patient = models.Patient(
        nombre="Luis",
        apellido_paterno="Perez",
        dni="SNAP-002",
        fecha_nacimiento="1991-02-02",
        sexo="M",
        owner_id=user.email,
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)

    payload = {
        "reason": "Chequeo",
        "diagnosis": "Normal",
        "treatment": "Control anual",
        "notes": "Sin hallazgos",
    }

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        res = client.post(f"/api/patients/{patient.id}/consultations", json=payload)
    finally:
        app.dependency_overrides = {}

    assert res.status_code == 201, res.text

    consultation = (
        db_session.query(models.ClinicalConsultation)
        .filter(models.ClinicalConsultation.patient_id == patient.id)
        .first()
    )
    assert consultation is not None
    assert consultation.examen_fisico == "Sin hallazgos"
    assert SNAPSHOT_MARKER not in (consultation.examen_fisico or "")
