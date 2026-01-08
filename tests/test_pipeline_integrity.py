import os
import sys

def test_pipeline_integrity():
    pipeline_path = os.path.join(os.getcwd(), ".github", "workflows", "pipeline.yml")
    
    if not os.path.exists(pipeline_path):
        print(f"FAIL: Pipeline file not found at {pipeline_path}")
        sys.exit(1)
        
    with open(pipeline_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    errors = []
    
    # Check 1: Auth action
    if "google-github-actions/auth" not in content:
        errors.append("Missing google-github-actions/auth")
        
    # Check 2: Deploy action
    if "google-github-actions/deploy-cloudrun" not in content:
        errors.append("Missing google-github-actions/deploy-cloudrun")
        
    # Check 3: No Placeholder
    if 'echo "Deploy logic via Google Cloud Actions would go here"' in content:
        errors.append("Found placeholder echo statement")
        
    if errors:
        print("FAIL: Pipeline integrity checks failed:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("PASS: Pipeline integrity checks passed")
        sys.exit(0)

if __name__ == "__main__":
    test_pipeline_integrity()
