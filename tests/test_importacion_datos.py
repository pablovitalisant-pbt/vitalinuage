import pytest
import requests

BASE_URL = "http://localhost:8000"

def test_import_csv_feature_disabled():
    """
    Test de Integración Fase D:
    Intentar subir un CSV.
    Esperamos 503 porque el feature flag está deshabilitado.
    """
    files = {'file': ('test.csv', 'nombre,apellido,dni\nJuan,Perez,123', 'text/csv')}
    
    try:
        response = requests.post(f"{BASE_URL}/api/import/csv", files=files, timeout=2)
        assert response.status_code == 503, f"Fallo esperado (Green): Feature Disabled (Status {response.status_code})"
    except requests.exceptions.ConnectionError:
        pytest.fail("Fallo server (Red expected)")

def test_import_schema_validation():
    """
    Test de Validación Fase D:
    Verificar comportamiento con flag disabled.
    Esperamos 503, por lo que no podemos validar el schema aún (lo haremos en la prueba de humo).
    """
    files = {'file': ('test.csv', 'nombre,apellido,dni\nJuan,Perez,123', 'text/csv')}
    
    try:
        response = requests.post(f"{BASE_URL}/api/import/csv", files=files, timeout=2)
        assert response.status_code == 503, f"Fallo esperado (Green): Feature Disabled (Status {response.status_code})"
    except Exception:
        pytest.fail("Fallo inesperado")
