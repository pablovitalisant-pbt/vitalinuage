# Slice RX-02-3: Stitch New Consultation UI (Contrato)

## Fuente del diseño
- Archivo fuente: `docs/stitch/new-consultation/stitch/code.html`
- Bloques a mapear: `aside` (sidebar), `header` (top bar), `main` (header paciente + card info + secciones 1–9), `footer` fijo con acciones.

## Mapeo Stitch → JSX (estructura)
1) Wrapper base:
   - `body` → `<div className="bg-background-light text-[#111318] min-h-screen">`
2) Sidebar fijo:
   - `<aside id="sidebar" class="fixed left-0 ... w-20">` se replica como JSX con los íconos, pero sin links funcionales (solo layout).
3) Header top:
   - `<header class="... pl-20">` con fecha y bloque de doctor.
4) Main:
   - `<main class="max-w-4xl mx-auto px-6 py-12 pl-20">`
   - Header paciente (nombre + tarjeta de fecha).
   - Card “Información del Paciente”.
   - Formulario por secciones numeradas 1–9.
5) Footer fijo:
   - `<footer class="fixed bottom-0 ... pl-20">` con botón Cancelar y Guardar Consulta.

## Mapeo de inputs actuales → secciones Stitch (sin cambiar name/value/onChange)
Sección 1: **Padecimiento Actual**
- `reason` (input actual) se mapea a `textarea#padecimiento`.

Sección 2: **Examen Físico**
- `weight` / `height` (inputs numéricos existentes) se mapean a cards “Peso” y “Estatura”.
- `imc` se muestra como texto calculado (si aplica) sin cambiar lógica de cálculo.
- `notes` se mapea a `textarea#examen`.

Sección 3: **Impresión Diagnóstica**
- `diagnosis` se mapea a `textarea#diagnostico`.
- `AIDiagnosisSearch` se mantiene en esta sección (si existe en layout, se añade bajo el textarea).

Sección 4: **Plan de Tratamiento**
- `treatment` se mapea a `textarea#tratamiento`.

Sección 5: **Receta**
- Se mantiene el mismo `treatment` (no se crea nuevo campo). Sección “Receta” reusa el mismo textarea o se representa como subtítulo si el diseño exige separación sin duplicar input.

Sección 6: **Interconsulta**
- No existe campo actual → se omite o se deja bloque visual sin input funcional (placeholder text), sin agregar nuevos keys.

Sección 7: **Licencia Médica**
- No existe campo actual → se omite o se deja bloque visual sin input funcional, sin agregar nuevos keys.

Sección 8: **Exámenes Solicitados**
- No existe campo actual → se omite o se deja bloque visual sin input funcional, sin agregar nuevos keys.

Sección 9: **Fecha del Próximo Control**
- No existe campo actual → se omite o se deja bloque visual sin input funcional, sin agregar nuevos keys.

Sección “Antecedentes”
- Los campos `alergias`, `patologicos`, `no_patologicos`, `heredofamiliares`, `quirurgicos`, `medicamentos_actuales` se reubican en un bloque card dentro de `main`, preservando nombres.

Biometría adicional
- `presion_arterial`, `frecuencia_cardiaca`, `temperatura_c` se mantienen en el layout dentro de Examen Físico o bloque de constantes vitales existente.

## Integridad funcional (obligatoria)
- `handleSubmit`, `runRecetaSubmitFlow`, `authFetch`, endpoints y navegación final `navigate(/patient/:id)` se mantienen intactos.
- `setError` y su texto no se modifican.
- No se agregan nuevos campos ni endpoints.

## Criterios de aceptación verificables
1) “Nueva Consulta” visible en cabecera con estilo Stitch.
2) Secciones numeradas 1–9 visibles (al menos la estructura/headers).
3) Botón fijo “Guardar Consulta” visible y es `submit`.
4) Flujo de guardado/receta sigue igual (mismos POSTs según `runRecetaSubmitFlow`).
