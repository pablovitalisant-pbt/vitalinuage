
import sys
import os

# Add backend to path
sys.path.append("backend")

print("Attempting to import schemas.patient...")
try:
    from schemas.patient import ClinicalRecord, ConsultationCreate
    print("SUCCESS: schemas.patient imported.")
except Exception as e:
    print(f"ERROR importing schemas.patient: {e}")
    import traceback
    traceback.print_exc()

print("\nAttempting to import main...")
try:
    from main import app
    print("SUCCESS: main imported.")
except Exception as e:
    print(f"ERROR importing main: {e}")
    import traceback
    traceback.print_exc()
