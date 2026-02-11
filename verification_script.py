import sys
import os
import json
import uuid
from unittest.mock import MagicMock, patch

print("Starting verification_script.py...")

# 1. MOCK DEPENDENCIES
# 1. MOCK DEPENDENCIES
mock_firebase = MagicMock()
mock_auth = MagicMock()

# Configure the verify_id_token function
def mock_verify_id_token(token, check_revoked=True):
    print(f"DEBUG: mock_verify_id_token called with {token}")
    return {"uid": "test_uid", "email": "test@example.com", "email_verified": True}

mock_auth.verify_id_token = mock_verify_id_token
mock_firebase.auth = mock_auth

sys.modules["firebase_admin"] = mock_firebase
sys.modules["firebase_admin.auth"] = mock_auth
sys.modules["backend.core.firebase_app"] = MagicMock()
print(f"DEBUG: Mocks configured. Verify ID Token function: {mock_auth.verify_id_token}")

# 2. SETUP PATHS
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')) # Assuming script is in root or we adjust
# Actually I will put this script in ROOT.
ROOT_DIR = os.getcwd()
sys.path.insert(0, ROOT_DIR)

# 3. MOCK ENVIRONMENT
os.environ["TESTING"] = "true"

# 4. IMPORTS
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.database import get_db
    import backend.models as models
    from backend import auth
except ImportError as e:
    print(f"CRITICAL IMPORT ERROR: {e}")
    sys.exit(1)

# 5. DB SETUP
# Force import of models so Base knows about them
import backend.models as models

engine_test = create_engine(
    "sqlite://", 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)

print("DEBUG: Creating tables...")
models.Base.metadata.create_all(bind=engine_test)
print("DEBUG: Tables created.")

SessionLocal = sessionmaker(bind=engine_test)

def override_get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

# 6. HELPERS
def setup_data(db):
    
    # Create Owner 
    email = f"doc_{uuid.uuid4()}@vital.com"
    
    # Update mock to return this email
    def mock_verify_id_token_with_email(token, check_revoked=True):
        print(f"DEBUG: mock_verify_id_token called with {token}")
        return {"uid": "test_uid", "email": email, "email_verified": True}
    
    mock_auth.verify_id_token = mock_verify_id_token_with_email
    
    try:
        # Check User model definition: email, hashed_password, is_verified.
        user = models.User(email=email, hashed_password="pw", is_verified=True)
        db.add(user)
        db.commit()
        print(f"DEBUG: Created user {email}")
    except Exception as e:
        print(f"USER CREATION FAILED: {e}")
        if hasattr(e, 'orig'): print(f"ORIGINAL: {e.orig}")
        raise e
        
    # Create Token
    token = auth.create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Patients
    unique_suffix = str(uuid.uuid4())[:8]
    p1 = models.Patient(
        nombre=f"Juan_{unique_suffix}", 
        apellido_paterno="Perez", 
        dni=f"DNI1-{unique_suffix}", 
        email="juan@mail.com", 
        telefono="999888777", 
        owner_id=email,
        fecha_nacimiento="1990-01-01"
    )

    p2 = models.Patient(
        nombre=f"Maria_{unique_suffix}", 
        apellido_paterno="Gomez", 
        dni=f"DNI2-{unique_suffix}", 
        email="maria@unique.com", 
        telefono="111222333", 
        owner_id=email,
        fecha_nacimiento="1992-02-02"
    )
    
    try:
        db.add(p1)
        db.add(p2)
        print(f"DEBUG: Committing P1({p1.dni}) and P2({p2.dni})")
        db.commit()
        print("DEBUG: Created patients P1 and P2")
        return headers, p1, p2
    except Exception as e:
        print(f"PATIENT CREATION FAILED: {e}")
        if hasattr(e, 'orig'): print(f"ORIGINAL: {e.orig}")
        raise e

# 7. TESTS
def run_tests():
    db = SessionLocal()
    headers, p1, p2 = setup_data(db)
    
    print("\n[TEST 1] Flag OFF (Legacy Behavior)...")
    res = client.get(f"/api/patients/search?q={p1.email}", headers=headers)
    if res.status_code == 200 and len(res.json().get("results", [])) == 0:
        print("P1-LEGACY: OK")
    else:
        print(f"P1-LEGACY: FAILED. Status={res.status_code}, Len={len(res.json().get('results', []))}")
        
    print("\n[TEST 2] Flag ON (Search by Email)...")
    # Enable Flag via Env to be robust
    os.environ["FEATURE_FLAGS_JSON"] = '{"patient_search_flexible_v1": true}'
    try:
        res = client.get(f"/api/patients/search?q={p1.email}", headers=headers)
        if res.status_code == 200 and len(res.json().get("results", [])) == 1:
            print("P2-EMAIL: OK")
        else:
            print(f"P2-EMAIL: FAILED. Body: {res.json()}")
    finally:
        del os.environ["FEATURE_FLAGS_JSON"]

    print("\n[TEST 3] Flag ON (Search by Phone)...")
    os.environ["FEATURE_FLAGS_JSON"] = '{"patient_search_flexible_v1": true}'
    try:
        res = client.get(f"/api/patients/search?q={p1.telefono}", headers=headers)
        if res.status_code == 200 and len(res.json().get("results", [])) == 1:
            print("P3-PHONE: OK")
        else:
            print(f"P3-PHONE: FAILED. Body: {res.json()}")
    finally:
        del os.environ["FEATURE_FLAGS_JSON"]

    print("\n[TEST 4] Flag ON (Multi-term P1)...")
    os.environ["FEATURE_FLAGS_JSON"] = '{"patient_search_flexible_v1": true}'
    try:
        search_q = f"Juan_{p1.dni.split('-')[1]} Perez"
        res = client.get(f"/api/patients/search?q={search_q}", headers=headers)
        if res.status_code == 200 and len(res.json().get("results", [])) == 1:
            print("P4-MULTI: OK")
        else:
            print(f"P4-MULTI: FAILED. Body: {res.json()}")
    finally:
        del os.environ["FEATURE_FLAGS_JSON"]

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL FAILURE: {e}")
