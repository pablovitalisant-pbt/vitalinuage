import pytest
from backend.services.migration_service import LegacyMigrationService
from unittest.mock import MagicMock, AsyncMock

# Service Instance
service = LegacyMigrationService()

@pytest.mark.parametrize("text, expected_weight, expected_height", [
    # Case 1: Standard Format
    ("Peso (kg)= 102\nEstatura(cm)= 148", 102.0, 148.0),
    # Case 2: Simple Text
    ("80kg. 1.70mt", 80.0, 170.0),
    # Case 3: Priority Handling (First match wins? Or specific format?)
    # Based on plan: "Peso (kg)=..." has priority over "Xkg"
    ("Peso: 75 ... perdida de 5kg", 75.0, None), 
    # Case 4: Height decimal normalization
    ("Talla: 1.65", None, 165.0),
    # Case 5: Garbage / No Data
    ("Sin datos relevantes", None, None),
])
def test_biometric_regex_extraction(text, expected_weight, expected_height):
    """
    Validates the Regex logic for extracting Weight and Height.
    This test is expected to FAIL until logic is implemented.
    """
    weight, height = service.extract_biometrics(text)
    assert weight == expected_weight
    assert height == expected_height



def test_identity_mapping_logic():
    """
    Validates logic: Consultas(PatientID) -> Map(UniqueID -> RUT) -> DB Check
    Sync version.
    """
    # Mocks
    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None # Simulate Patient Not Found
    
    # Configure execute (sync)
    mock_db.execute.return_value = mock_result
    
    # Simulate add/flush/refresh
    mock_db.add = MagicMock()
    mock_db.flush = MagicMock()
    mock_db.refresh = MagicMock()
    
    # Sample Data
    consultas_row = {
        'Paciente': 'LEGACY_123', # The Link
        'Exploracion Fisica': 'Peso (kg)= 70',
        'Diagnostico': 'Test Diag'
    }
    
    # The Map loaded from Pacientes CSV
    patient_map = {
        'LEGACY_123': {
            'unique id': 'LEGACY_123',
            'Identificacion': '12.345.678-9',
            'Nombre': 'Juan Perez',
            'Fecha de Nacimiento': '1980-01-01'
        }
    }
    
    service.process_consultation_row(consultas_row, patient_map, mock_db)
    
    # Assertions
    assert mock_db.execute.called
    assert mock_db.add.call_count >= 1 
    
    added_obj = mock_db.add.call_args_list[0][0][0]
    assert added_obj.dni == '12345678-9'
    assert added_obj.owner_id == "15" # Strict Attribution Check
    
    added_cons = mock_db.add.call_args_list[-1][0][0]
    assert added_cons.owner_id == "15"
    assert added_cons.peso_kg == 70.0
