# Slice 06: Remove Allergy Banner, Show in Header

## Objetivo
Eliminar el banner `allergy-alert-banner` en `/patient/:id` y mostrar alergias como texto discreto en la cabecera del paciente.

## Before / After
- Before: banner grande de alergias encima del contenido.
- After: no existe banner. En la cabecera aparece una línea: `Alergias: <texto>`.

## Comportamiento
- Si hay alergias: mostrar `Alergias: <texto>`.
- Si está vacío: no mostrar la línea.

## Criterios de aceptación
- No existe `data-testid="allergy-alert-banner"`.
- En cabecera existe el texto `Alergias:` cuando hay alergias (`"Penicilina"` en el mock).

## Files-to-touch
- `frontend/src/pages/PatientProfile.tsx`
- `docs/specs/slice-06-remove-allergy-banner-show-in-header.md`
- `frontend/src/tests/slice-06-remove-allergy-banner-show-in-header.test.tsx`

## No-goals
- No tocar backend/DB/auth/CI.
- No cambiar API; reutilizar datos ya cargados.
