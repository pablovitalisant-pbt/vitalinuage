# Hosting Build Integrity Contract (Slice A)

## Objetivo
Garantizar que Firebase Hosting en producción sirva el build del commit actual de `main`.

## Contrato ejecutable (CI)
- Después de `vite build`, el bundle debe contener el `GITHUB_SHA` del commit.
- El workflow debe fallar si no encuentra el SHA en `dist/assets/index-*.js`.

## Señales obligatorias
- `VITE_APP_COMMIT_SHA` se inyecta en el build con `${{ github.sha }}`.
- La app expone `window.__APP_COMMIT__` con el valor de `VITE_APP_COMMIT_SHA`.

## Criterios de aceptación verificables
1. En logs de CI:
   - `✅ Build verification passed...`
   - No aparece el error `Build does not contain current commit SHA.`
2. En producción (solo navegador):
   - Abrir consola y ejecutar `window.__APP_COMMIT__`.
   - Debe coincidir con el SHA del commit desplegado en `main`.
