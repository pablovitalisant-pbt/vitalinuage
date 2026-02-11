# Slice 04: Remove "Antecedentes" Tab in Patient Profile

## Objetivo
Eliminar la pestaña "Antecedentes" de `/patient/:id` y su contenido asociado.

## Before / After (tabs)
- Before: `Consultas & Historial`, `Antecedentes`, `Recetas`
- After: `Consultas & Historial`, `Recetas`

## Criterios de aceptación
- NO existe el tab/label "Antecedentes" en `/patient/:id`.
- SI existen los tabs "Consultas & Historial" y "Recetas".

## Files-to-touch
- `frontend/src/pages/PatientProfile.tsx`
- `docs/specs/slice-04-remove-antecedentes-tab.md`
- `frontend/src/tests/slice-04-remove-antecedentes-tab.test.tsx`

## No-goals
- No tocar backend, DB, auth, CI/CD.
- No agregar reemplazos visuales ni nuevas tabs.
