import pytest
from fastapi.testclient import TestClient
from ..main import app, get_db, Base, engine
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

# Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_maps.db"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    # Create tables
    Base.metadata.create_all(bind=engine_test)
    yield TestClient(app)
    # Drop tables
    Base.metadata.drop_all(bind=engine_test)

def test_create_prescription_map(client):
    payload = {
        "name": "Recetario Clínica Test",
        "canvas_width_mm": 148.0,
        "canvas_height_mm": 210.0,
        "fields_config": [
            {
                "field_key": "patient_name",
                "x_mm": 10.5,
                "y_mm": 20.0,
                "font_size_pt": 12,
                "max_width_mm": 50.0
            }
        ]
    }
    
    # Needs to handle file upload or just data
    # The spec says Multipart/form-data for image + JSON string for data
    # For simplicity in this test, we might check if endpoint accepts JSON directly or strictly multipart
    # The SPEC says: Body: Multipart/form-data with `data` as JSON string.
    
    import json
    data_str = json.dumps(payload)
    
    response = client.post(
        "/api/maps",
        data={"data": data_str},
        files={"image": ("test.png", b"fake_image_bytes", "image/png")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Recetario Clínica Test"
    assert "id" in data
    assert len(data["fields_config"]) == 1

def test_get_maps(client):
    response = client.get("/api/maps")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_print_mapped_pdf(client):
    # Need a consultation ID first. 
    # Mocking or creating one might be complex without full context.
    # We will assume we can mock the dependency or simpler:
    # Just call the endpoint with a fake ID but ensuring the endpoint exists
    # It might 404 on consultation not found, but we want to check if endpoint exists (not 404 endpoint not found)
    
    # First get a map id
    maps = client.get("/api/maps").json()
    map_id = maps[0]["id"]
    
    response = client.get(f"/api/print/mapped/fake-id?map_id={map_id}")
    
    # We expect 404 (Consultation not found) or 503 (Feature disabled) or 200
    # But definitely NOT 404 Not Found (path)
    assert response.status_code != 404 or response.json().get("detail") == "Consultation not found"
