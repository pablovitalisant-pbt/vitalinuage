import requests
import os
import io

BASE_URL = "http://127.0.0.1:8000"

def test_get_preferences_default(setup_db=None):
    """
    Test that GET /api/doctor/preferences returns 200 and default values
    even if none were explicitly set (should create default).
    """
    resp = requests.get(f"{BASE_URL}/api/doctor/preferences")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert "paper_size" in data
    assert "template_id" in data
    assert data["paper_size"] in ["A4", "A5"]
    assert data["template_id"] in ["minimal", "modern", "classic"]

def test_update_preferences():
    """
    Test that PUT /api/doctor/preferences updates the values.
    """
    payload = {
        "paper_size": "A5",
        "template_id": "modern",
        "header_text": "Clinica Vitali - Dr. Juan",
        "footer_text": "Gracias por su visita"
    }
    
    # Update
    resp = requests.put(f"{BASE_URL}/api/doctor/preferences", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["paper_size"] == "A5"
    assert data["template_id"] == "modern"
    assert data["header_text"] == "Clinica Vitali - Dr. Juan"
    
    # Verify persistence with GET
    resp_get = requests.get(f"{BASE_URL}/api/doctor/preferences")
    assert resp_get.json()["paper_size"] == "A5"

def test_upload_logo():
    """
    Test POST /api/doctor/logo upload flow.
    """
    # Create a dummy image file in memory
    img_bytes = b"fake_image_content_png_signature"
    file = io.BytesIO(img_bytes)
    
    files = {
        "file": ("test_logo.png", file, "image/png")
    }
    
    resp = requests.post(f"{BASE_URL}/api/doctor/logo", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "logo_url" in data
    assert data["logo_url"].endswith(".png")
