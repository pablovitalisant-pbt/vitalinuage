import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import pytest
from pydantic import ValidationError
from schemas.prescription_map import PrescriptionMapCreate, FieldConfig

def test_valid_prescription_map():
    # Happy path
    valid_data = {
        "name": "Mapa Standard",
        "canvas_width_mm": 148.0,
        "canvas_height_mm": 210.0,
        "fields_config": [
            {"field_key": "patient_name", "x_mm": 10, "y_mm": 20, "font_size_pt": 12},
            {"field_key": "date", "x_mm": 100, "y_mm": 20, "font_size_pt": 10}
        ],
        "is_active": True
    }
    map_obj = PrescriptionMapCreate(**valid_data)
    assert map_obj.name == "Mapa Standard"
    assert len(map_obj.fields_config) == 2

def test_invalid_field_config_missing_coords():
    # Missing x/y
    invalid_data = {
        "field_key": "test"
        # Missing x, y
    }
    with pytest.raises(ValidationError):
        FieldConfig(**invalid_data)

def test_default_values():
    # Check A5 defaults
    data = {
        "name": "Default Size",
        "fields_config": []
    }
    map_obj = PrescriptionMapCreate(**data)
    assert map_obj.canvas_width_mm == 148.0
    assert map_obj.canvas_height_mm == 210.0

def test_types_validation():
    # String for float field
    with pytest.raises(ValidationError):
        PrescriptionMapCreate(
            name="Bad Type",
            canvas_width_mm="not-a-number",
            fields_config=[]
        )
