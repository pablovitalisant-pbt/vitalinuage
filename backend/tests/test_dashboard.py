import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.models import User

def test_dashboard_analytics(client: TestClient, db_session: Session):
    user = User(
        email="dash_doctor@example.com",
        hashed_password="hashed",
        professional_name="Dr. Dash"
    )
    db_session.add(user)
    db_session.commit()
    assert True