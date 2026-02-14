# Slice NC-02 — Campos 5–9 y Persistencia (Contrato)

## Objetivo
Separar **Plan de Tratamiento** y **Receta** como campos independientes y persistir campos 5–9 en backend.

## Campos (frontend -> backend)
- `treatment` (Plan de Tratamiento) ✅
- `receta` (texto receta)
- `interconsulta`
- `licencia_medica`
- `examenes_solicitados`
- `proximo_control` (fecha, string `YYYY-MM-DD`)

## Backend
Agregar campos en:
- `backend/schemas/consultations.py` (Pydantic)
- `backend/models.py` (SQLAlchemy)
- Endpoint de creación de consulta (`backend/api/patients.py`)

## Persistencia DB
El repo no tiene migrations automáticas activas para estas columnas.
Acción requerida en DB:
- Agregar columnas en `clinical_consultations`:
  - `receta`, `interconsulta`, `licencia_medica`, `examenes_solicitados`, `proximo_control`

## Criterios de aceptación
1. Al guardar, el payload incluye todos los campos 5–9.
2. `receta` y `treatment` son independientes.
3. `proximo_control` se envía como string `YYYY-MM-DD`.
