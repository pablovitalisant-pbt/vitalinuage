# Slice NC-04 — Save wiring + observabilidad mínima

## Objetivo
Asegurar que el click en “Guardar Consulta” dispare el submit real (handleSubmit → authFetch POST) y que errores de validación sean visibles fuera de inputs/textarea. Agregar observabilidad mínima solo en desarrollo cuando no se dispara request.

## Alcance
- Archivo: `frontend/src/pages/NewConsultation.tsx`
- Tests: `frontend/src/tests/slice-nc-04-save-wiring.test.tsx`

## Contrato funcional
- Click en “Guardar Consulta” debe ejecutar `handleSubmit` y disparar `authFetch` con `POST /api/patients/:id/consultations`.
- Si el formulario es inválido, se muestra un error visible (no dentro de inputs) y no se hace request.
- El status del footer solo cambia en intentos de guardado.
- No insertar strings tipo `check_circle` en inputs/textarea.

## Observabilidad (dev-only)
- Si el submit no dispara request por validación o por `patientId` faltante, se registra `console.warn` en `NODE_ENV=development`.

## Criterios de aceptación
1. Al click de “Guardar Consulta”, `authFetch` recibe el POST de consultas.
2. En invalid form, se ve el error “Completa los campos obligatorios.”
3. No aparecen strings de íconos dentro de inputs/textarea.
