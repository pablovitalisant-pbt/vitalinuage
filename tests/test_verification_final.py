from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.main import app
from backend.database import get_db, Base
from backend import models
import pytest
import uuid
from unittest.mock import patch

# 1. Setup InMemory DB
SQLALCHEMY_DATABASE_URL = "sqlite://" 
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_full_verification_flow():
    """
    E2E Test: Register -> Get Token from DB -> Verify -> Check Status
    """
    # Mock Email Service to avoid calling Resend (we tested that separately)
    # We mainly want to ensure the token is generated and saved in DB
    with patch("backend.auth.EmailService.send_verification_email") as mock_email:
        # 1. Register User
        email = "final_verify@example.com"
        pwd = "SecurePassword123!"
        resp_reg = client.post("/api/auth/register", json={
            "email": email,
            "password": pwd,
            "professional_name": "Dr. Final"
        })
        assert resp_reg.status_code == 201
        
        # 2. Extract Token from DB (Since API doesn't return it for security)
        db = TestingSessionLocal()
        user = db.query(models.User).filter_by(email=email).first()
        assert user is not None
        token = user.verification_token
        assert token is not None
        assert user.is_verified is False
        db.close()
        
        print(f"\n[TEST] User registered. Token retrieved: {token}")

        # 3. Verify Account via Endpoint
        resp_verify = client.get(f"/api/auth/verify?token={token}")
        assert resp_verify.status_code == 200
        assert resp_verify.json()["message"] == "Email verificado correctamente"
        
        # 4. Confirm Database State
        db2 = TestingSessionLocal()
        user_verified = db2.query(models.User).filter_by(email=email).first()
        assert user_verified.is_verified is True
        assert user_verified.verification_token is None
        print("[TEST] User status updated to Verified. Token cleared.")
        db2.close()

if __name__ == "__main__":
    test_full_verification_flow()
