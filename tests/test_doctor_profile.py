import pytest
import requests
import time

BASE_URL = "http://localhost:8000"

def test_doctor_profile_persistence():
    # Wait for server if needed
    time.sleep(1)
    
    # 1. Get initial profile (should create default)
    resp_get = requests.get(f"{BASE_URL}/api/doctor/profile")
    assert resp_get.status_code == 200, f"Error GET profile: {resp_get.text}"
    profile = resp_get.json()
    assert profile["professional_name"] == "Dr. Juan Vitali"
    
    # 2. Update profile
    new_data = {
        "professional_name": "Dr. Gregory House",
        "specialty": "Diagnóstico",
        "address": "Princeton",
        "phone": "911"
    }
    resp_put = requests.put(f"{BASE_URL}/api/doctor/profile", json=new_data)
    assert resp_put.status_code == 200, f"Error PUT profile: {resp_put.text}"
    updated = resp_put.json()
    assert updated["professional_name"] == "Dr. Gregory House"
    
    # 3. Verify persistence
    resp_get_2 = requests.get(f"{BASE_URL}/api/doctor/profile")
    assert resp_get_2.status_code == 200
    persisted = resp_get_2.json()
    assert persisted["professional_name"] == "Dr. Gregory House"
