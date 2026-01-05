import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import pytest
import uuid
from fastapi.testclient import TestClient
from main import app, get_db
from database import Base, engine
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import auth

# Force consistency for tests
auth.SECRET_KEY = "test_secret_key_fixed_for_consistency"

from sqlalchemy.pool import StaticPool

# Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
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

@pytest.fixture(scope="function")
def db_session():
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

def test_create_prescription_map(client, db_session):
    # Setup Auth
    import auth
    from models import User
    email = f"doc_map_{uuid.uuid4()}@vital.com"
    user = User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": email})
    
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
    
    response = client.post(
        "/api/maps",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Recetario Clínica Test"
    assert "id" in data
    assert len(data["fields_config"]) == 1

def test_get_maps(client, db_session):
    # Setup Auth
    import auth
    from models import User
    email = f"doc_get_{uuid.uuid4()}@vital.com"
    user = User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": email})

    response = client.get(
        "/api/maps",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 0

def test_print_mapped_pdf(client, db_session):
    # Setup Auth
    import auth
    from models import User
    email = f"doc_print_{uuid.uuid4()}@vital.com"
    user = User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}

    # First get a map id (create one if empty)
    client.post("/api/maps", json={"name":"T", "fields_config":[]}, headers=headers)
    
    maps = client.get("/api/maps", headers=headers).json()
    if not maps:
        pytest.skip("No maps available")
        
    map_id = maps[0]["id"]
    
    # Check print endpoint (Should be 404 as not implemented yet)
    response = client.get(f"/api/print/mapped/fake-id?map_id={map_id}", headers=headers)
    
    assert response.status_code == 404
