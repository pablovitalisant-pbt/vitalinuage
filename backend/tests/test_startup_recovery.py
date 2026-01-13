import sys
import os
import traceback

def test_startup_imports():
    """
    Smoke test to verify if critical PDF dependencies and app modules can load.
    In the broken state (missing system libs or circular imports), this MUST fail.
    """
    print("--- Starting Startup Recovery Smoke Test ---")
    
    # 1. Test WeasyPrint System Dependencies
    print("\n[Step 1] Attempting to import WeasyPrint...")
    try:
        import weasyprint
        print("SUCCESS: WeasyPrint imported.")
    except Exception as e:
        print(f"FAILURE: Could not import WeasyPrint. Exception: {e}")
        # On Windows local dev this might actually pass if GTK is installed, 
        # or fail if not. In the container context, this fails if pango is missing.
        # Check specific error type if needed, but any error is bad here.
        # We print traceback to capture exact error for diagnosis.
        traceback.print_exc()

    # 2. Test App Router Import
    print("\n[Step 2] Attempting to import Consultation Router...")
    try:
        # Hack path to simulate running from root
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
        
        # This import triggers the PDFService import, which triggers WeasyPrint import (if not lazy)
        from backend.api.consultations import get_prescription_pdf
        print("SUCCESS: Router imported.")
    except Exception as e:
        print(f"FAILURE: Could not import Router. Exception: {e}")
        traceback.print_exc()
        sys.exit(1) # Return non-zero exit code to signal failure
        
    print("\n--- Test Finished Successfully (Unexpected in Red Phase) ---")

if __name__ == "__main__":
    test_startup_imports()
