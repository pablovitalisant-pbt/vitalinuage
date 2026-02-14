# Slice NC-05 — Footer faithful + botón

## Objetivo
Alinear la barra inferior al layout de Stitch (con altura reducida a 50%), manteniendo estados correctos y botón funcional.

## Alcance
- Archivo: `frontend/src/pages/NewConsultation.tsx`
- Tests: `frontend/src/tests/slice-nc-03-footer-status-save.test.tsx`, `frontend/src/tests/slice-nc-05-footer-button-style.test.tsx`

## Contrato de estados
- `idle`: no mostrar status.
- `submitting`: mostrar “Guardando…” solo tras click.
- `success`: mostrar “Listo para guardar” solo tras respuesta OK.
- `error`: mostrar “Error al guardar” solo tras fallo.

## Reglas de UI
- Footer fiel a Stitch en estructura/clases; altura ≈ 50% reduciendo padding.
- Botón “Guardar Consulta” con estilo primary y icono tipo Stitch.
- Sin duplicar header/topbar ni sidebar.

## Criterios de aceptación
1. No hay status al cargar ni al tipear.
2. Status aparece solo tras intento de guardado.
3. Footer contiene `bg-white/80`, `backdrop-blur-md`, padding reducido y botón primary.
