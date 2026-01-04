import pytest
import requests

BASE_URL = "http://localhost:8000"

def test_infrastructure_smoke():
    """
    Test de Humo Fase B:
    Verifica que la infraestructura base responda.
    Falla si el servidor no está levantado.
    """
    try:
        response = requests.get(f"{BASE_URL}/", timeout=1)
        # Aceptamos 404 (Not Found) como señal de vida del servidor, o 200.
        assert response.status_code in [200, 404], "El servidor no respondió con un código válido."
    except requests.exceptions.ConnectionError:
        pytest.fail("Smoke Test Fallido (Red): No se detecta servicio escuchando en el puerto base.")
    except Exception as e:
        pytest.fail(f"Smoke Test Fallido (Red): {str(e)}")
