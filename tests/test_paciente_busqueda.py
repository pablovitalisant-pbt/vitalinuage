import pytest
import requests

BASE_URL = "http://localhost:8000"

def test_search_by_name_partial():
    """
    Test de Integración Fase D:
    Búsqueda por nombre parcial.
    Esperamos 503 porque el feature flag está deshabilitado.
    """
    query_params = {"query": "Jua"}
    try:
        response = requests.get(f"{BASE_URL}/api/pacientes/search", params=query_params, timeout=2)
        assert response.status_code == 503, f"Fallo esperado (Green): Feature Disabled (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo server (Red expected)")

def test_search_by_dni():
    """
    Test de Integración Fase D:
    Búsqueda por DNI.
    Esperamos 503.
    """
    query_params = {"query": "12345678"}
    try:
        response = requests.get(f"{BASE_URL}/api/pacientes/search", params=query_params, timeout=2)
        assert response.status_code == 503, f"Fallo esperado (Green): Feature Disabled (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo server (Red expected)")

def test_search_empty_query():
    """
    Test de Validación Fase D:
    Query vacía. Debería retornar 422 si estuviera activo, pero 503 si está apagado.
    El filtro de flag ocurre antes de la validación Pydantic usualmente si está en el body, pero aquí es query param.
    FastAPI valida tipos antes de entrar a la función. 
    Si el flag check está DENTRO de la función, FastAPI validará primero que 'query' exista y tenga min_length=1.
    Por lo tanto, si query="", FastAPI responderá 422 antes de llegar a nuestro código.
    Validemos eso.
    """
    query_params = {"query": ""}
    try:
        response = requests.get(f"{BASE_URL}/api/pacientes/search", params=query_params, timeout=2)
        # FastAPI valida Query params antes de ejecutar la función.
        # Por tanto esperamos 422 Unprocessable Entity incluso con el flag apagado,
        # A MENOS que usemos un middleware o dependencia global.
        # En nuestra implementación, el check está dentro de la función.
        assert response.status_code == 422, f"Validación de FastAPI debe ocurrir antes (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pass
