import pytest
import os
from database import Base, engine

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """
    Global session fixture to clean up database registration metadata 
    to prevent 'Multiple classes found' registry errors during testing.
    Also ensures fresh DB schema for in-memory SQLite.
    """
    # Force cleanup of SQLAlchemy Class Registry
    # This addresses 'Multiple classes found for path...' errors
    # caused by importing models via different paths (backend.models vs models)
    for key in list(Base.registry._class_registry.keys()):
        del Base.registry._class_registry[key]
    
    # 2. Drop and Create All Tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # Teardown
    Base.metadata.drop_all(bind=engine)
