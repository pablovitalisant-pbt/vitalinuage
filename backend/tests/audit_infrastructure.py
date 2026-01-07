import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# ANSI Colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def colored(text, color, attrs=None):
    # Simple map for compatibility
    if color == "red": code = Colors.FAIL
    elif color == "green": code = Colors.GREEN
    elif color == "yellow": code = Colors.WARNING
    elif color == "cyan": code = Colors.CYAN
    elif color == "white": code = Colors.BOLD
    else: code = ""
    return f"{code}{text}{Colors.ENDC}"

try:
    from core.config import settings
    from database import engine
    from schemas.doctor import DoctorProfile
except ImportError as e:
    print(colored(f"CRITICAL: Import Error - {e}", "red"))
    sys.exit(1)

def audit_infrastructure():
    print(colored("=== Vitalinuage Infrastructure Audit (Slice 24.0) ===", "cyan", attrs=["bold"]))
    
    # 1. Database Connection Certification
    db_url = settings.DATABASE_URL
    is_sqlite = "sqlite" in db_url
    is_postgres = "postgresql" in db_url
    
    print(colored("\n[DATABASE CERTIFICATION]", "white", attrs=["bold"]))
    if is_sqlite:
        print(colored(f"⚠  Mode: LOCAL/FALLBACK (SQLite)", "yellow"))
        print(f"   URL: {db_url}")
        print("   Note: Usage of SQLite is valid for CI/CD and Dev, but NOT for Production Login Flow.")
    elif is_postgres:
        if "neon" in db_url or "compute" in db_url: # Heuristic for Neon
            print(colored(f"✔  Mode: PRODUCTION (Neon)", "green"))
        else:
            print(colored(f"✔  Mode: PRODUCTION (Generic Postgres)", "green"))
        print(f"   URL: {db_url.split('@')[-1]}") # Mask credential
    else:
         print(colored(f"❌ Mode: UNKNOWN", "red"))
         print(f"   URL: {db_url}")

    # 2. CORS Transparency
    print(colored("\n[CORS TRANSPARENCY]", "white", attrs=["bold"]))
    origins = settings.cors_origins
    print(colored(f"✔  Active Origins ({len(origins)}):", "green"))
    for origin in origins:
        print(f"   - {origin}")
    
    required_dev = "http://localhost:5173"
    if required_dev in origins:
        print(colored(f"   ✔ Dev Port 5173 Permitted", "green"))
    else:
        print(colored(f"   ❌ Dev Port 5173 BLOCKED", "red"))

    # 3. Contract Validation (Frontend Compatibility)
    print(colored("\n[CONTRACT VALIDATION]", "white", attrs=["bold"]))
    
    # Check fields in Pydantic Schema vs Frontend Expectations
    # Pydantic v2 uses model_fields
    schema_cls = DoctorProfile
    schema_fields = schema_cls.model_fields if hasattr(schema_cls, "model_fields") else schema_cls.__fields__
    print(f"   Backend Schema: {schema_cls.__name__}")
    
    # Critical Fields (Python names)
    critical_fields = ["id", "email", "full_name"] 
    
    missing_crit = [f for f in critical_fields if f not in schema_fields]
    if not missing_crit:
         print(colored("   ✔ Critical Fields Present", "green"))
    else:
         print(colored(f"   ❌ Critical Fields Missing: {missing_crit}", "red"))

    # Flexible Fields (Python names)
    flex_fields = ["medical_license", "specialty", "phone", "address", "bio", "profile_image", "role", "is_verified", "created_at"]
    
    missing_flex = [f for f in flex_fields if f not in schema_fields]
    if not missing_flex:
         print(colored("   ✔ Extended Profile Fields Supported", "green"))
    else:
         print(colored(f"   ⚠ Backend missing extended fields: {missing_flex}", "yellow"))

    print(colored("\n=== Audit Complete ===", "cyan"))

if __name__ == "__main__":
    try:
        audit_infrastructure()
    except Exception as e:
        print(colored(f"FATAL: Audit Failed - {e}", "red"))
        sys.exit(1)
