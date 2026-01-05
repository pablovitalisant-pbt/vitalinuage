import os
import glob
import time

def clean_dbs():
    # Target directory: backend/tests/
    # Also create_engine with ./test_... creates them in CWD usually.
    # Currently running from root.
    # We check root and backend/tests just in case.
    
    patterns = ["*.db", "backend/tests/*.db"]
    
    print("Cleaning up .db files...")
    
    for pattern in patterns:
        files = glob.glob(pattern)
        for f in files:
            try:
                print(f"Removing {f}...")
                os.remove(f)
            except OSError as e:
                print(f"Error removing {f}: {e}")
                
if __name__ == "__main__":
    clean_dbs()
