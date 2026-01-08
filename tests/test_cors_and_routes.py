from fastapi.testclient import TestClient
from backend.main import app
import pytest

client = TestClient(app)

def test_cors_configuration():
    """Validates CORS headers are present for allowed origins."""
    origin = "https://vitalinuage.web.app"
    response = client.options(
        "/api/health",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        }
    )
    # If middleware is missing, OPTIONS might return 405 or 200 without headers
    # We check specifically for the Access-Control-Allow-Origin header
    
    # Debug info
    print(f"CORS Response Headers: {response.headers}")
    
    assert response.headers.get("access-control-allow-origin") == origin, \
        "CORS Header missing or incorrect"

def test_preferences_endpoint_existence():
    """Validates that the preferences stub exists."""
    # It requires auth usually, but if it doesn't exist it returns 404
    # If it exists but requires auth, it returns 401
    response = client.get("/api/doctors/preferences")
    assert response.status_code != 404, "/api/doctors/preferences stub not found (404)"

if __name__ == "__main__":
    try:
        print("Running CORS Test...")
        test_cors_configuration()
        print("Running Preferences Endpoint Test...")
        test_preferences_endpoint_existence()
        print("PASS: System Integration Check")
    except Exception as e:
        print(f"FAIL: {e}")
