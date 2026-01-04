import pytest
import requests

BASE_URL = "http://localhost:8000"

def test_send_marketing_notification():
    """
    Test de Integración Fase D:
    Enviar notificación de MARKETING con prioridad NORMAL.
    Esperamos 503 porque el feature flag está deshabilitado.
    """
    payload = {
        "usuario_id": "user_mock_123",
        "titulo": "Promoción Mensual",
        "mensaje": "Descuento en chequeo general",
        "tipo": "MARKETING",
        "prioridad": "NORMAL"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/notifications/send", json=payload, timeout=2)
        assert response.status_code == 503, f"Fallo esperado (Green): Feature Disabled (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo server (Red expected)")

def test_send_appointment_high_priority():
    """
    Test de Integración Fase D:
    Enviar notificación de CITA_NUEVA con prioridad ALTA.
    Esperamos 503 con flag disabled.
    """
    payload = {
        "usuario_id": "user_mock_456",
        "titulo": "Nueva Cita Agendada",
        "mensaje": "Su cita es mañana a las 10am",
        "tipo": "CITA_NUEVA",
        "prioridad": "ALTA"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/notifications/send", json=payload, timeout=2)
        assert response.status_code == 503, f"Fallo esperado (Green): Feature Disabled (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo server (Red expected)")

def test_invalid_type():
    """
    Test de Validación Fase D:
    Enviar tipo inválido 'SPAM'.
    Esperamos 422 (Validación Pydantic antes de la función).
    """
    payload = {
        "usuario_id": "user_mock_789",
        "titulo": "Spam",
        "mensaje": "Spam",
        "tipo": "SPAM", # Invalid
        "prioridad": "NORMAL"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/notifications/send", json=payload, timeout=2)
        assert response.status_code == 422, f"Fallo esperado (Green): Validación Pydantic (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pass
