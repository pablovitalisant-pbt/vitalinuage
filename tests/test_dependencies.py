import os
import sys

def test_requirements_content():
    req_path = os.path.join("backend", "requirements.txt")
    if not os.path.exists(req_path):
        print(f"FAIL: {req_path} not found")
        sys.exit(1)

    with open(req_path, "r") as f:
        content = f.read()

    missing = []
    required = [
        "fastapi",
        "uvicorn[standard]",
        "python-dotenv",
        "pydantic-settings",
        "sqlalchemy",
        "psycopg2-binary",
        "pytest",
        "httpx",
        "pytest-xdist",
        "email-validator",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "python-multipart",
        "qrcode",
        "Pillow",
        "resend",
        "reportlab",
        "weasyprint",
        "jinja2"
    ]

    for item in required:
        if item not in content:
            missing.append(item)

    if missing:
        print("FAIL: Missing dependencies in requirements.txt:")
        for m in missing:
            print(f"  - {m}")
        sys.exit(1)
    
    print("PASS: All required dependencies found.")
    sys.exit(0)

if __name__ == "__main__":
    test_requirements_content()
