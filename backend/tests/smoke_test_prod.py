import os
import requests
import pytest

def test_production_health_check():
    """
    Verifies that the production environment is up and running.
    Requires PROD_API_URL environment variable to be set.
    """
    base_url = os.getenv("PROD_API_URL")
    if not base_url:
        pytest.fail("PROD_API_URL environment variable is not set. Cannot run smoke test.")

    print(f"Smoke Testing URL: {base_url}")
    
    try:
        # Check Main Health Endpoint
        response = requests.get(f"{base_url}/api/health", timeout=10)
        
        # Log response for debugging
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        assert response.status_code == 200, f"Health check failed with {response.status_code}"
        
        json_resp = response.json()
        assert json_resp.get("status") == "READY", f"Expected status 'READY', got '{json_resp.get('status')}'"
        assert json_resp.get("version") == "1.0.0", f"Expected version '1.0.0', got '{json_resp.get('version')}'"
        
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Connection to production failed: {str(e)}")
