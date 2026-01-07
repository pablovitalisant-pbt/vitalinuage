import pytest
import os
from database import Base, engine
import models 

@pytest.fixture(autouse=True)
def clean_database():
    """
    Protocolo Saneado v1.2.9:
    Clean metadata BUT DO NOT DISPOSE REGISTRY.
    Disposing registry breaks class instrumentation (TypeError on __init__).
    Relies on Import Unification (all tests use 'import models') to avoid Multiple Classes error.
    """
    # 1. Clear Metadata (The Table Cache) (DISABLED)
    # Base.metadata.clear()
    pass
    
    # 2. Physical Clean
    Base.metadata.drop_all(bind=engine)
    
    # 3. Re-create
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # Teardown
    Base.metadata.drop_all(bind=engine)
    # Base.registry.dispose() # DO NOT CALL THIS, it breaks models.
