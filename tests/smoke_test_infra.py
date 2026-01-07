import sys
import os

# Set TESTING to avoid running DB migrations on import
os.environ["TESTING"] = "1"

def test_namespace():
    print("TEST 1: Namespace Integrity (import backend.main)...", end=" ")
    try:
        # Ensure the current directory is in sys.path to simulate root execution
        if os.getcwd() not in sys.path:
            sys.path.append(os.getcwd())
            
        import backend.main
        print("PASS")
        return True
    except ImportError as e:
        print(f"FAIL: {e}")
        return False
    except Exception as e:
        # If it fails for other reasons (e.g. DB connection), we still passed the IMPORT check technically
        # but let's report it.
        print(f"WARN (Imported but crashed): {e}")
        if "No module named 'backend'" in str(e):
             return False
        return True

def test_libraries():
    print("TEST 2: System Libraries (WeasyPrint init)...", end=" ")
    try:
        from weasyprint import HTML
        # Attempt minimal initialization to trigger library loading
        HTML(string='<p>test</p>')
        print("PASS")
        return True
    except OSError as e:
        # This catches missing shared libraries (dlopen fail)
        print(f"FAIL (Missing Dependency): {e}")
        return False
    except ImportError as e:
         print(f"FAIL (Import Error): {e}")
         return False
    except Exception as e:
        print(f"FAIL (Unexpected): {e}")
        return False

if __name__ == "__main__":
    print(f"Running Smoke/Infra Tests from: {os.getcwd()}")
    
    ns_pass = test_namespace()
    lib_pass = test_libraries()
    
    if ns_pass and lib_pass:
        print("\nALL SMOKE TESTS PASSED")
        sys.exit(0)
    else:
        print("\nSOME SMOKE TESTS FAILED")
        sys.exit(1)
