import pytest
import os
import sys

# FORZAR entorno de test ANTES de cualquier importación de modelos
os.environ["TESTING"] = "1"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import Base, engine, SessionLocal
from backend.models import User, Patient, MedicalBackground, ClinicalConsultation, Prescription

@pytest.fixture(autouse=True, scope="function")
def setup_db():
    """
    Crea las tablas antes de cada test. Al usar StaticPool, 
    esto ocurre en la base de datos en memoria compartida.
    """
    Base.registry.dispose() # Limpiar registro para evitar "Multiple classes found"
    Base.metadata.create_all(bind=engine)
    yield
    # Opcional: Base.metadata.drop_all(bind=engine) si se desea aislamiento total

@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.database import get_db

    def _get_test_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()