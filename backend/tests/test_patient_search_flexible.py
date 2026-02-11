from fastapi.testclient import TestClient
import uuid
import pytest
import sys
import os
import json
from unittest.mock import MagicMock, patch

# --- Mock Firebase Admin BEFORE module imports ---
# This prevents "ModuleNotFoundError: No module named 'firebase_admin'"
sys.modules["firebase_admin"] = MagicMock()
sys.modules["firebase_admin.auth"] = MagicMock()
sys.modules["backend.core.firebase_app"] = MagicMock()

# Configure verify_id_token to actually work with our fake tokens
def mock_verify_id_token(token, check_revoked=True):
    from jose import jwt
    # Decode without verification because we don't have the private key used by create_access_token easily handy 
    # (it uses SECRET_KEY from env, but let's just trust the payload for tests)
    return jwt.get_unverified_claims(token)

sys.modules["firebase_admin.auth"].verify_id_token = mock_verify_id_token

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.main import app
from backend.database import get_db
import backend.models as models
# Fix import of auth (assuming backend/auth.py exists and is importable as backend.auth)
try:
    from backend import auth
except ImportError:
    # Fallback if auth.py is not a module but a file in backend/
    import auth # dependent on sys.path but we cleaned it. 
    # If backend is package, from backend import auth is correct.

# Re-use client fixture pattern from test_patients_search.py or conftest
# Since conftest.py has db_session and db_setup, we'll use them.
# We need to manually create the client here if not provided by conftest (conftest only had db fixtures)
# Wait, conftest.py in the view doesn't have 'client'.
# Let's verify test_patients_search.py again. It defines its own client fixture.
# I will define a local client fixture here to be safe and self-contained, using the db_setup from conftest if possible,
# or just setting up the override like test_patients_search.py did.

# Actually test_patients_search.py uses TestingSessionLocal and override_get_db.
# I will copy that pattern to ensure consistency.

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
    Mock the verify_feature_flag or the json load.
    Since the implementation will likely look at a file or env var,
    we can patch the function that checks the flag.
    However, I haven't implemented the check yet.
    
    Strategy: I will mock 'backend.api.patients.check_feature_flag' 
    (or whatever I name it, likely a local helper or imported one).
    
    Actually, to be robust against implementation details, I can mock `json.load` 
    if I read the file directly, or `os.getenv`.
    
    Better yet: I will patch the specific function I plan to write/use.
    Let's assume I'll write a helper `is_flexible_search_enabled()` in `patients.py`.
    """
    with patch('backend.api.patients.is_flexible_search_enabled') as mock:
        yield mock

# --- Tests ---

def test_legacy_search_flag_off(client, db_session):
    """
    REQ: Flag OFF -> Match EXACTLY legacy behavior (Name/DNI only).
    """
    # 1. Setup Auth
    import backend.core.security as auth_lib # fallback if needed
    try:
        from backend import auth
    except:
        import auth 
    
    email = f"doc_legacy_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Setup Data
    # Matchable by Name
    p1 = models.Patient(
        nombre="Juan", apellido_paterno="Perez", dni=f"111-{uuid.uuid4()}", email="juan@mail.com", telefono="999", owner_id=email
    )
    # Matchable by Email (Legacy shouldn't find this by email)
    p2 = models.Patient(
        nombre="Pedro", apellido_paterno="Gomez", dni=f"222-{uuid.uuid4()}", email="unique@mail.com", telefono="888", owner_id=email
    )
    db_session.add_all([p1, p2])
    print(f"DEBUG: Attempting to commit patients. P1: {p1.dni}, {p1.owner_id}. P2: {p2.dni}, {p2.owner_id}")
    try:
        db_session.commit()
    except Exception as e:
        print(f"DEBUG: Commit failed! {e}")
        raise e
    
    # 3. Execution (Flag OFF)
    # Check current behavior (Flag defaults to False in config, we haven't mocked it to True yet)
    
    response = client.get("/api/patients/search?q=unique@mail.com", headers=headers)
    assert response.status_code == 200
    results = response.json().get("results", [])
    assert len(results) == 0, "Legacy search should NOT look at email"

def test_flexible_search_email(client, db_session):
    """
    REQ: Flag ON -> Search by Email returns patient.
    """
    # Setup
    try:
        from backend import auth
    except:
        import auth
        
    email = f"doc_flex_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}
    
    target_dni = f"333-{uuid.uuid4()}"
    p = models.Patient(
        nombre="Maria", apellido_paterno="Lopez", dni=target_dni, email="maria_flex@test.com", owner_id=email
    )
    db_session.add(p)
    db_session.commit()
    
    # Force Flag ON
    with patch('backend.api.patients.is_flexible_search_enabled', return_value=True):
        response = client.get("/api/patients/search?q=maria_flex@test.com", headers=headers)
        
    assert response.status_code == 200
    results = response.json().get("results", [])
    
    assert len(results) == 1
    # Check ID or DNI match
    assert results[0]["dni"] == target_dni

def test_flexible_search_phone(client, db_session):
    """
    REQ: Flag ON -> Search by Phone returns patient.
    """
    # Setup
    try:
        from backend import auth
    except:
        import auth
        
    email = f"doc_phone_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}
    
    target_dni = f"444-{uuid.uuid4()}"
    p = models.Patient(
        nombre="Carlos", apellido_paterno="Sanz", dni=target_dni, telefono="+5699999999", owner_id=email
    )
    db_session.add(p)
    db_session.commit()
    
    # Force Flag ON
    with patch('backend.api.patients.is_flexible_search_enabled', return_value=True):
        response = client.get("/api/patients/search?q=9999999", headers=headers)
        
    assert response.status_code == 200
    results = response.json().get("results", [])
    assert len(results) == 1
    assert results[0]["dni"] == target_dni

def test_flexible_search_multi_term(client, db_session):
    """
    REQ: Flag ON -> "Nombre Apellido" matches even if fields are separate.
    """
    # Setup
    try:
        from backend import auth
    except:
        import auth
        
    email = f"doc_multi_{uuid.uuid4()}@vital.com"
    user = models.User(email=email, hashed_password="pw", is_verified=True)
    db_session.add(user)
    db_session.commit()
    
    token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}
    
    target_dni = f"555-{uuid.uuid4()}"
    p = models.Patient(
        nombre="Jose", apellido_paterno="Quinteros", dni=target_dni, owner_id=email
    )
    db_session.add(p)
    db_session.commit()
    
    with patch('backend.api.patients.is_flexible_search_enabled', return_value=True):
        response = client.get("/api/patients/search?q=Jose Quinteros", headers=headers)
        
    assert response.status_code == 200
    results = response.json().get("results", [])
    assert len(results) == 1
    assert results[0]["dni"] == target_dni
