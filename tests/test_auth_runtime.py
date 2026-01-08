from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.main import app
from backend.database import get_db, Base
import pytest
import secrets

# 1. Configurar DB en Memoria (Isolation)
SQLALCHEMY_DATABASE_URL = "sqlite://" # In-memory
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Setup Schema fresco
Base.metadata.create_all(bind=engine)

# 3. Dependency Override
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_register_runtime_crash():
    """
    Simulates a real user registration to check for 500 Internal Server Errors.
    Runs on isolated Schema to avoid 'OperationalError'.
    """
    # Create unique email to avoid 400
    random_suffix = secrets.token_hex(4)
    email = f"runtime_test_{random_suffix}@example.com"
    password = "SafePassword123!"
    professional_name = "Dr. Runtime Fix"

    print(f"\n[TEST] Attempting register with {email}...")
    
    try:
        response = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": password,
                "professional_name": professional_name
            }
        )
        
        print(f"[TEST] Status Code: {response.status_code}")
        
        # We expect 201. If 500, this assertion will fail and show the body (traceback if debug).
        assert response.status_code == 201, f"Registration failed with {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["email"] == email
        assert "message" in data
        
    except Exception as e:
        pytest.fail(f"Test Execution Error: {e}")

if __name__ == "__main__":
    test_register_runtime_crash()

