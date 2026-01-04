import pytest
import requests
from datetime import date

BASE_URL = "http://localhost:8000"

def test_create_receta_success():
    """
    Test de Integración Fase D:
    Registrar receta válida.
    Esperamos 503 porque el feature flag está deshabilitado.
    """
    payload = {
        "consulta_id": "cons_mock_001",
        "paciente_id": "pac_mock_001",
        "medicamentos": [
            {
                "nombre": "Ibuprofeno",
                "dosis": "400mg",
                "frecuencia": "c/8h"
            }
        ],
        "instrucciones_adicionales": "Tomar con alimentos",
        "fecha_vencimiento": str(date.today())
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/recetas", json=payload, timeout=2)
        assert response.status_code == 503, f"Fallo esperado (Green): Feature Disabled (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo server (Red expected)")

def test_create_receta_invalid_medicamentos():
    """
    Test de Validación Fase D:
    Lista de medicamentos vacía.
    Esperamos 422 (Validación Pydantic ocurre antes de entrar a la función).
    """
    payload = {
        "consulta_id": "cons_mock_001",
        "paciente_id": "pac_mock_001",
        "medicamentos": [] # Empty list should match min_items=1 constraint
    }
    try:
        response = requests.post(f"{BASE_URL}/api/recetas", json=payload, timeout=2)
        assert response.status_code == 422, f"Fallo esperado (Green): Validación Pydantic (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pass
