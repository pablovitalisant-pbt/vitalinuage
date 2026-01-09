from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User
from backend.database import SessionLocal
import pytest

client = TestClient(app)

@pytest.fixture
def db_session_prefs():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_doctor_preferences_put_endpoint(db_session_prefs):
    # 1. Setup Data
    email = "prefs_test@example.com"
    
    # Create User
    existing_user = db_session_prefs.query(User).filter(User.email == email).first()
    if existing_user:
        db_session_prefs.delete(existing_user)
        db_session_prefs.commit()

    user = User(
        email=email,
        hashed_password="hashed_password",
        professional_name="Dr. Prefs",
        is_verified=True,
        is_onboarded=True
    )
    db_session_prefs.add(user)
    db_session_prefs.commit()
    db_session_prefs.refresh(user)
    
    # Mock Auth dependency
    from backend.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        # 2. Test PUT
        payload = {
            "paper_size": "A4",
            "template_id": "modern",
            "header_text": "Clinica Test"
        }
        response = client.put("/api/doctors/preferences", json=payload)
        
        # Expectation: 200 OK
        assert response.status_code == 200, f"Failed PUT Preferences. Got: {response.status_code} - {response.text}"
        
        # Verify the backend actually processed the payload (Validation)
        data = response.json()
        assert data["status"] == "success"
        # Since persistence is stubbed (no DB columns yet), we check the 'received' echo
        assert data["received"]["paper_size"] == "A4"
        assert data["received"]["template_id"] == "modern"

    finally:
        app.dependency_overrides = {}
        # Cleanup
        db_session_prefs.delete(user)
        db_session_prefs.commit()
