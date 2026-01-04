import pytest
import requests
from datetime import date

BASE_URL = "http://localhost:8000"

def test_create_paciente_success():
    """
    Test de Integración Fase B:
    Intenta registrar un paciente válido.
    Esperamos 503 con flag disabled.
    """
    payload = {
        "nombre": "Juan",
        "apellido_paterno": "Perez",
        "apellido_materno": "Gomez",
        "dni": "12345678",
        "fecha_nacimiento": "1990-01-01",
        "sexo": "M",
        "telefono": "987654321",
        "email": "juan.perez@example.com",
        "direccion": "Av. Siempre Viva 123",
        "peso": 70.5,
        "talla": 175.0,
        "imc": 23.0
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/pacientes", json=payload, timeout=2)
        assert response.status_code == 503
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo: El servidor no está corriendo.")

def test_create_paciente_invalid_data():
    """
    Test de Validación Fase B:
    Intenta enviar datos inválidos.
    Esperamos 503 con flag disabled.
    """
    payload = {"nombre": "Juan", "peso": -5.0}
    try:
        response = requests.post(f"{BASE_URL}/api/pacientes", json=payload, timeout=2)
        assert response.status_code == 503
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo server error")
