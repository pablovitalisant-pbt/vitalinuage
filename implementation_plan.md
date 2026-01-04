# Plan de Implementación - Slice 15.2 (Talonario Mapper)

## Objetivo
Implementar la funcionalidad de backend para mapear e imprimir prescripciones sobre hojas pre-impresas (Talonarios). Esto permitirá guardar coordenadas (x, y) de campos específicos y generar un PDF con el texto posicionado exactamente para coincidir con el papel físico.

## User Review Required
> [!IMPORTANT]
> **Coordenadas en Milímetros:** Se ha decidido usar milímetros relativos al borde superior izquierdo de una hoja A5 como sistema de coordenadas para garantizar consistencia física.
> **Nueva Tabla:** Se creará la tabla `prescription_maps` en la base de datos.

## Proposed Changes

### Backend

#### [NEW] [models.py](file:///c:/Users/pablo/Documents/Vitalinuage/backend/models.py)
Agregar la clase `PrescriptionMap` con:
- `id` (PK)
- `doctor_id` (FK)
- `name`
- `background_image_path`
- `canvas_width_mm`, `canvas_height_mm`
- `fields_config` (JSON)

#### [NEW] [schemas.py](file:///c:/Users/pablo/Documents/Vitalinuage/backend/schemas.py)
Agregar modelos Pydantic:
- `PrescriptionMapCreate`
- `PrescriptionMapUpdate`
- `PrescriptionMapResponse`

#### [MODIFY] [main.py](file:///c:/Users/pablo/Documents/Vitalinuage/backend/main.py)
Implementar endpoints:
- `POST /api/maps`
- `GET /api/maps`
- `GET /api/maps/{id}`
- `DELETE /api/maps/{id}`
- `GET /api/print/mapped/{consultation_id}` (Lógica de impresión con WeasyPrint)

### Tests

#### [NEW] [test_prescription_map.py](file:///c:/Users/pablo/Documents/Vitalinuage/backend/tests/test_prescription_map.py)
Crear tests de integración para verificar:
- Creación de mapa valida la estructura JSON.
- Recuperación de mapas.
- Endpoint de impresión retorna PDF (status 200).

## Verification Plan

### Automated Tests
Ejecutar la suite de pruebas con pytest:
```bash
pytest backend/tests/test_prescription_map.py -v
```

### Manual Verification
1. **Crear un Mapa:** Usar `curl` o Postman para crear un mapa con coordenadas conocidas (ej: `patient_name` en `x=10mm, y=10mm`).
2. **Imprimir:** Llamar a `/api/print/mapped/{id}?map_id={map_id}&debug=true`.
3. **Verificar PDF:** Abrir el PDF generado y confirmar visualmente que el texto "Patient Name" aparece en la esquina superior izquierda (aprox 1cm de los bordes).
