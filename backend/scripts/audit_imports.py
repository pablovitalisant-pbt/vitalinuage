import os
import ast
import sys

def get_std_libs():
    return {
        "os", "sys", "logging", "typing", "datetime", "time", "uuid", "io",
        "json", "pathlib", "subprocess", "math", "random", "re", "shutil",
        "tempfile", "unittest", "copy", "hashlib", "secrets", "dataclasses",
        "enum", "functools", "abc", "collections", "itertools", "urllib", "email",
        "http", "socket", "threading", "contextlib", "inspect", "platform",
         "xml", "html", "base64"
    }

def get_installed_pkgs(req_file):
    pkgs = set()
    if os.path.exists(req_file):
        with open(req_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                # Handle extras like uvicorn[standard] -> uvicorn
                pkg_name = line.split('[')[0].split('==')[0].split('>=')[0].strip().lower()
                pkgs.add(pkg_name)
    else:
        print(f"Warning: {req_file} not found.")
    return pkgs

def get_imports_from_file(filepath):
    imports = set()
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            root = ast.parse(f.read(), filename=filepath)
        
        for node in ast.walk(root):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
    except Exception as e:
        # print(f"Error parsing {filepath}: {e}")
        pass
    return imports

def main():
    backend_dir = os.path.abspath("backend")
    req_file = os.path.join(backend_dir, "requirements.txt")
    
    declared_pkgs = get_installed_pkgs(req_file)
    std_libs = get_std_libs()
    
    used_imports = set()
    
    for root_dir, _, files in os.walk(backend_dir):
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root_dir, file)
                file_imports = get_imports_from_file(filepath)
                used_imports.update(file_imports)
    
    # Filter
    external_imports = set()
    for imp in used_imports:
        if imp in std_libs:
            continue
        if imp == "backend": # Internal
            continue
        if imp == "main": # Likely internal main.py
            continue
        if imp == "database": # Internal
            continue
        if imp == "schemas": # Internal
            continue
        if imp == "models": # Internal
            continue
        if imp == "crud": # Internal
             continue
        if imp == "dependencies": # Internal
            continue
        if imp == "auth": # Internal
             continue
        if imp == "config": # Internal
             continue
        if imp == "services": # Internal
             continue
        
        # Heuristic for internal modules (files in root usually)
        if os.path.exists(os.path.join(backend_dir, imp + ".py")):
            continue
            
        external_imports.add(imp)

    # Manual Mapping for known packages that import differently validation
    # e.g. python-jose imports jose, passlib imports passlib
    # python-multipart imports multipart? No, usually it's for FastAPI Internal
    # pydantic_settings imports pydantic_settings
    
    # We compare base import names vs package names.
    # Package: email-validator -> Import: email_validator (usually)
    # Package: python-jose -> Import: jose
    # Package: python-dotenv -> Import: dotenv
    # Package: psycopg2-binary -> Import: psycopg2
    
    mapping = {
        "jose": "python-jose",
        "dotenv": "python-dotenv",
        "psycopg2": "psycopg2-binary",
        "email_validator": "email-validator",
        "multipart": "python-multipart" 
    }
    
    print("| Módulo Usado | ¿En requirements? | Acción Sugerida |")
    print("| :--- | :--- | :--- |")
    
    for imp in sorted(external_imports):
        pkg_name = mapping.get(imp, imp) # Try to map import to package name
        
        # Special check (hyphens vs underscores)
        normalized_imp = imp.replace('_', '-')
        
        in_req = (pkg_name.lower() in declared_pkgs) or (imp.lower() in declared_pkgs) or (normalized_imp in declared_pkgs)
        
        status = "✅ SI" if in_req else "❌ NO"
        action = "Ninguna" if in_req else "Investigar / Agregar"
        
        print(f"| {imp} | {status} | {action} |")

if __name__ == "__main__":
    main()
