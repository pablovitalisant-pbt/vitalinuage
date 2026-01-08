from fastapi.testclient import TestClient
from backend.main import app
import pytest

client = TestClient(app)

def test_routing_integrity():
    """
    Verifica que las rutas criticas esten correctamente registradas y accesibles.
    Falla si encuentra 404 (Not Found) en rutas que deberian existir.
    """
    routes_to_check = [
        # (method, path, expected_status_not_404)
        
        # 1. Users (Fixing double prefix)
        # Auth usually required, so 401/403 is good. 404 is BAD.
        ("PUT", "/api/users/onboarding"), 
        
        # 2. Patients (Missing import)
        ("GET", "/api/patients"),
        
        # 3. Audit (Missing import)
        # 3. Audit (Missing import)
        ("GET", "/api/audit/dispatch-summary"),

        # 4. Doctor Profile (Fixing double prefix)
        ("GET", "/api/doctors/profile"),

        # 5. Medical Background (Fixing redundant prefix)
        ("GET", "/api/medical-background/pacientes/1/antecedentes"),
    ]
    
    failures = []
    
    for method, path in routes_to_check:
        if method == "GET":
            response = client.get(path)
        elif method == "PUT":
            response = client.put(path)
            
        print(f"Checking {method} {path} -> {response.status_code}")
        
        if response.status_code == 404:
            failures.append(f"{method} {path} returned 404 (Not Found) - Router might be missing or miss-configured")
            
    if failures:
        pytest.fail("\n".join(failures))

if __name__ == "__main__":
    # Allow running directly
    try:
        test_routing_integrity()
        print("PASS: All routes found")
    except Exception as e:
        print(f"FAIL: {e}")
