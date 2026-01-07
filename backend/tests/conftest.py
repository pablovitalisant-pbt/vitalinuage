import pytest
import os
import sys

# FORZAR entorno de test ANTES de cualquier importación de modelos
os.environ["TESTING"] = "1"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.db_core import Base, engine
from backend.models import User, Patient, MedicalBackground, ClinicalConsultation, Prescription
from backend.database import SessionLocal

@pytest.fixture(autouse=True, scope="function")
def memory_surgery():
    """
    Cirugía de Metadatos:
    Elimina definiciones de índices del objeto MetaData de Python y limpia el registro
    antes de crear las tablas. Esto evita 'Index already exists' y 'Multiple classes found'.
    """
    # 1. Limpiar registro de clases
    Base.registry.dispose()
    
    # 2. Cirugía: Eliminar definiciones de índices del objeto MetaData de Python
    # Esto evita que SQLite intente crear un índice que Python "cree" que ya existe,
    # especialmente si el modelo se importó múltiples veces.
    for table in Base.metadata.tables.values():
        table.indexes.clear()
        
    yield

@pytest.fixture(autouse=True, scope="function")
def setup_db(memory_surgery):
    """
    Crea las tablas antes de cada test. Al usar StaticPool, 
    esto ocurre en la base de datos en memoria compartida.
    """
    Base.metadata.create_all(bind=engine)
    yield
    # Opcional: Base.metadata.drop_all(bind=engine)

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