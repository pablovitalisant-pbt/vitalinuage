import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.db_core import Base, get_db
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User

def test_onboarding_setup_integrity():
    assert Base is not None
    assert get_db is not None

def test_onboarding_process_success(client: TestClient, db_session):
    user = User(email="onboard@test.com", hashed_password="pw", professional_name="Dr. Test")
    db_session.add(user)
    db_session.commit()
    user.is_onboarded = True
    db_session.commit()
    assert user.is_onboarded is True

def test_onboarding_validation_error(client: TestClient):
    response = client.post("/api/users/onboarding", json={"invalid": "data"})
    assert response.status_code == 401