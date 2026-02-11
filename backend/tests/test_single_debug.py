from fastapi.testclient import TestClient
import uuid
import pytest
import sys
import os
import json
from unittest.mock import MagicMock, patch

# --- Mock Firebase Admin BEFORE module imports ---
sys.modules["firebase_admin"] = MagicMock()
sys.modules["firebase_admin.auth"] = MagicMock()
sys.modules["backend.core.firebase_app"] = MagicMock()

def mock_verify_id_token(token, check_revoked=True):
    from jose import jwt
    return jwt.get_unverified_claims(token)

sys.modules["firebase_admin.auth"].verify_id_token = mock_verify_id_token

# Setup path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, ROOT_DIR)

from backend.main import app
from backend.database import get_db
import backend.models as models
try:
    from backend import auth
except:
    import auth

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup Test Database (Memory)
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

@pytest.fixture(scope="function")
def client():
    # Setup
    models.Base.metadata.create_all(bind=engine_test)
    yield TestClient(app)
    # Teardown
    models.Base.metadata.drop_all(bind=engine_test)

@pytest.fixture(scope="function")
def db_session():
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

# --- Helper to Mock Feature Flags ---
@pytest.fixture
def mock_feature_flags():
    """
    Mock the verification logic.
    """
    with patch('backend.api.patients.is_flexible_search_enabled') as mock:
        yield mock

# --- Single Test ---

def test_legacy_search_flag_off(client, db_session):
    """
    REQ: Flag OFF -> Match EXACTLY legacy behavior (Name/DNI only).
    """
    
    email = f"doc_legacy_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    try:
        db_session.commit()
    except Exception as e:
        print(f"DEBUG: User commit failed! {e}")
        raise e
    
    token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Setup Data
    p1 = models.Patient(
        nombre="Juan", apellido_paterno="Perez", dni=f"111-{uuid.uuid4()}", email="juan@mail.com", telefono="999", owner_id=email
    )
    db_session.add(p1)
    print(f"DEBUG: Committing P1: {p1.dni}, {p1.owner_id}")
    try:
        db_session.commit()
    except Exception as e:
        print(f"DEBUG: P1 commit failed! {e}")
        raise e

    p2 = models.Patient(
        nombre="Pedro", apellido_paterno="Gomez", dni=f"222-{uuid.uuid4()}", email="unique@mail.com", telefono="888", owner_id=email
    )
    db_session.add(p2)
    print(f"DEBUG: Committing P2: {p2.dni}, {p2.owner_id}")
    try:
        db_session.commit()
    except Exception as e:
        print(f"DEBUG: P2 commit failed! {e}")
        raise e
    
    # 3. Execution (Flag OFF)
    response = client.get("/api/patients/search?q=unique@mail.com", headers=headers)
    assert response.status_code == 200
    results = response.json().get("results", [])
    assert len(results) == 0, "Legacy search should NOT look at email"
