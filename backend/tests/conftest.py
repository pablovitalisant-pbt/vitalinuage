import pytest
from sqlalchemy import MetaData
from main import app # Ensure app is imported to register routers/models if side-effects needed
from database import Base, engine

@pytest.fixture(autouse=True)
def clean_database():
    """
    Protocolo Nuclear v1.2.7:
    Deep cleanup of metadata and tables before EACH test function.
    Ensures total isolation.
    """
    # 1. Clear SQLAlchemy internal Metadata/Registry
    Base.metadata.clear()
    
    # 2. Drop all tables physically
    Base.metadata.drop_all(bind=engine)
    
    # 3. Create all tables fresh
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # 4. Teardown
    Base.metadata.drop_all(bind=engine)
