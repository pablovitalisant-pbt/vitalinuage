# Slice RX-02-2: UI Wireup (New Consultation → Prescription POST)

## Evidencia (repo)
- `frontend/src/pages/NewConsultation.tsx:44-106` — `handleSubmit` hace POST a `/api/patients/${patientId}/consultations`.
- `frontend/src/pages/NewConsultation.tsx:297-311` — textarea "Plan de Tratamiento / Receta" usa `name="treatment"` y `formData.treatment`.
- `frontend/src/pages/NewConsultation.tsx:9` — `parseRecetaToMedications` ya importado.
- `frontend/src/lib/recetaSubmitFlow.ts` — `runRecetaSubmitFlow` disponible.

## Contrato del slice
- Usar `runRecetaSubmitFlow` dentro de `handleSubmit` con:
  - `recetaText`: `formData.treatment` (único textarea con etiqueta "Plan de Tratamiento / Receta").
  - `parseReceta`: `parseRecetaToMedications`.
  - `postConsultation`: wrapper del POST actual a `/api/patients/${patientId}/consultations` que devuelve JSON.
  - `postPrescription`: POST a `/api/patients/consultations/{consultation_id}/prescription` con `{ consultation_id, medications }`.
- Si parse error: `setError` con mensaje exacto y no hacer fetch.
- Si parse ok y meds vacíos: solo POST consulta.
- Si parse ok y meds con datos: POST consulta y luego POST receta.
- Mantener navegación final a `/patient/${patientId}`.

## Criterios de aceptación
- Receta inválida: error exacto y cero POSTs.
- Receta válida con meds: 2 POSTs (consulta, receta) con `consultation_id` correcto.
- Receta vacía: solo POST consulta.

## Files-to-touch
- `frontend/src/pages/NewConsultation.tsx`
- `frontend/src/tests/slice-rx-02-2-ui-wireup.test.tsx`
- `docs/specs/slice-rx-02-2-ui-wireup.md`
