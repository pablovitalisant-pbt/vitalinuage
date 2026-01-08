
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.main import app
from backend.database import get_db, Base
from backend import models
import pytest
import uuid

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

def test_verification_flow():
    """
    Integration test for Account Verification provided by Slice 11.1
    """
    # 1. Arrange: Create a user with a token
    db = TestingSessionLocal()
    token = str(uuid.uuid4())
    
    user_clean = models.User(
        email="verify_test_clean@example.com",
        hashed_password="fake_hash",
        verification_token=token,
        is_verified=False
    )
    
    db.add(user_clean)
    db.commit()
    db.refresh(user_clean)
    db.close()
    
    print(f"\n[TEST] Created user with token: {token}")

    # 2. Act: Call verify endpoint
    response = client.get(f"/api/auth/verify?token={token}")
    
    # 3. Assert Success
    assert response.status_code == 200
    assert response.json()["message"] == "Email verificado correctamente"
    
    # 4. Assert State Change
    db2 = TestingSessionLocal()
    updated_user = db2.query(models.User).filter_by(email="verify_test_clean@example.com").first()
    assert updated_user.is_verified is True
    assert updated_user.verification_token is None # Consumed
    db2.close()
    print("[TEST] User verified and token consumed.")

    # 5. Act: Try verifying again (Should fail)
    response_retry = client.get(f"/api/auth/verify?token={token}")
    assert response_retry.status_code == 400
    assert response_retry.json()["detail"] == "Token inválido o expirado"
    print("[TEST] Re-verification blocked correctly.")

if __name__ == "__main__":
    test_verification_flow()
