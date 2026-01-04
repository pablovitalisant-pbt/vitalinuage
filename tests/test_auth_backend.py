import pytest
import requests

BASE_URL = "http://localhost:8000"

def test_login_contract_compliance():
    """
    Test de Integración Fase B:
    Intenta enviar un payload válido de Login según el contrato definido.
    Se espera que falle (404, 500 o Connection Refused) ya que la implementación no existe.
    """
    payload = {
        "email": "medico@vitalinuage.com",
        "password": "passwordSeguro123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=2)
        
        # Si llegamos aquí, validamos que NO sea un éxito todavía (o que sea 404)
        # Como es Fase B, un 404 es aceptable (endpoint no encontrado)
        # Pero si recibimos 200 OK, el test fallará porque no debería estar implementado.
        assert response.status_code != 200, "El endpoint respondió 200 OK pero no debería estar implementado aún."
        
        # Validaciones de contrato si respondiera algo (futuro)
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo esperado (Red): El servidor backend no está en ejecución.")
    except Exception as e:
        pytest.fail(f"Fallo esperado (Red): Error al conectar: {str(e)}")
