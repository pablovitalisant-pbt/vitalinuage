import pytest
import os
from database import Base, engine
# Import models to ensure they are registered (even if we dispose later, 
# it helps confirm what we are clearing)
import models 

@pytest.fixture(autouse=True)
def clean_database():
    """
    Protocolo Unificado v1.2.8:
    Ensures Registry and Metadata are pristine for EVERY test.
    Handles 'Multiple classes found' by disposing registry.
    """
    # 1. Dispose Registry (The Class Cache)
    # This is critical for preventing duplication errors if imports are mixed
    Base.registry.dispose()
    
    # 2. Clear Metadata (The Table Cache)
    Base.metadata.clear()
    
    # 3. Physical Clean
    Base.metadata.drop_all(bind=engine)
    
    # 4. Re-create
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # Teardown
    Base.metadata.drop_all(bind=engine)
    Base.registry.dispose()
