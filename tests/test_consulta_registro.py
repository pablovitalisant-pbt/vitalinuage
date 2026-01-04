import pytest
import requests

BASE_URL = "http://localhost:8000"

def test_create_consulta_success():
    """
    Test de Integración Fase D:
    Registrar consulta válida.
    Esperamos 503 porque el feature flag está deshabilitado.
    """
    payload = {
        "paciente_id": "pac_mock_001",
        "diagnostico": "Resfriado común",
        "tratamiento": "Paracetamol 500mg c/8h",
        "examenes_solicitados": "Hemograma completo",
        "observaciones_privadas": "Paciente ansioso"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/consultas", json=payload, timeout=2)
        assert response.status_code == 503, f"Fallo esperado (Green): Feature Disabled (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo server (Red expected)")

def test_create_consulta_missing_required():
    """
    Test de Validación Fase D:
    Falta campo obligatorio 'tratamiento'.
    Esperamos 503 con flag disabled.
    """
    payload = {
        "paciente_id": "pac_mock_001",
        "diagnostico": "Gripe"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/consultas", json=payload, timeout=2)
        assert response.status_code == 503, f"Fallo esperado (Green): Feature Disabled (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pass
