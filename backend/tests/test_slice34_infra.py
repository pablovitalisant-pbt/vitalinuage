
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend import models

client = TestClient(app)

class TestSlice34Infra:
    
    def test_clinical_consultation_model_has_biometric_fields(self):
        """
        GREEN TEST:
        Verifies that ClinicalConsultation model accepts and persists biometric fields.
        """
        try:
            consultation = models.ClinicalConsultation(
                patient_id=1,
                owner_id="doc@test.com",
                motivo_consulta="Checkup",
                diagnostico="Healthy",
                plan_tratamiento="None",
                peso_kg=70.5,
                estatura_cm=170.0,
                imc=24.4,
                presion_arterial="120/80"
            )
            assert consultation.peso_kg == 70.5
            assert consultation.estatura_cm == 170.0
            assert consultation.presion_arterial == "120/80"
        except TypeError as e:
            pytest.fail(f"Model failed to accept new arguments: {e}")

    def test_ai_diagnosis_endpoint_exists(self):
        """
        GREEN TEST:
        Verifies that the Gemini AI diagnosis endpoint exists and is reachable.
        We expect 200, 422 (validation), or 500 (API Error), BUT NOT 404.
        """
        payload = {"text": "Paciente presenta dolor lumbar agudo irradiado a pierna derecha."}
        
        # Mocking the AI service would be best, but for Smoke Test, checking existence (not 404) is enough
        from unittest.mock import patch
        
        # We patch the service to avoid calling real Gemini API and consuming quota/requiring key in test
        with patch('backend.api.endpoints.diagnosis.get_gemini_diagnosis') as mock_ai:
            mock_ai.return_value = [
                {"code": "M54.5", "description": "Lumbago no especificado", "relevance_reason": "Test Match"}
            ]
            
            response = client.post("/api/diagnosis/suggest-cie10", json=payload)
            
            assert response.status_code == 200, f"Endpoint returned {response.status_code}, expected 200"
            data = response.json()
            assert "suggestions" in data
            assert len(data["suggestions"]) > 0
            assert data["suggestions"][0]["code"] == "M54.5"
