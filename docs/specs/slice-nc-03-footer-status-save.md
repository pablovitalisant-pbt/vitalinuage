# Slice NC-03 — Barra Inferior y Estado de Guardado (Contrato)

## Objetivo
Barra inferior fiel a Stitch, con altura = 50% de la actual, y estados de guardado correctos.

## Reglas de estado
- **Idle**: no se muestra mensaje.
- **Submitting**: `Guardando...`
- **Success**: `Listo para guardar`
- **Error**: `Error al guardar`

## Reglas UX
- No mostrar mensajes al tipear.
- El botón “Guardar Consulta” refleja estado loading y está deshabilitado mientras guarda.
- La barra no tapa contenido: `main` mantiene padding inferior.

## Criterios de aceptación
1. Mensajes solo aparecen después de intentar guardar.
2. En éxito aparece `Listo para guardar`.
3. En error aparece `Error al guardar`.
4. No hay texto extraño dentro de inputs.
