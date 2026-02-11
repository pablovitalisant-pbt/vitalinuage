# Slice RX-01: Fix Prescription Domain (Medication model)

## Objetivo
Eliminar el error crítico donde el backend intenta crear `models.Medication` que no existe, dejando el sistema de recetas técnicamente válido.

## Criterios de aceptación
- Existe el modelo `Medication` y se persiste en DB con FK a `prescriptions`.
- `Prescription` expone relación 1:N con `Medication`.
- El endpoint `POST /api/patients/consultations/{consultation_id}/prescription` crea prescription + medications sin error.
- No se cambia el contrato HTTP.

## No-goals
- No UI, no frontend, no parsing, no Stitch, no feature flags.
