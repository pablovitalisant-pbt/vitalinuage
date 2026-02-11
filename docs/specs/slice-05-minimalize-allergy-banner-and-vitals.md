# Slice 05: Minimalize Allergy Banner and Vitals Cards

## Objetivo
Reducir el impacto visual del banner de alergias y las tarjetas de signos vitales en `/patient/:id`.

## Before / After

### A) Banner Alergias (`data-testid="allergy-alert-banner"`)
- Before: gradiente rojo/naranjo, borde rojo fuerte, padding grande, muy llamativo.
- After: fondo neutral (`bg-slate-50` o `bg-white`), borde suave `border-slate-200`, padding menor, texto más pequeño sin mayúsculas exageradas, icono más pequeño y menos saturado.

### B) Cards signos vitales (`data-testid="vital-signs-grid"` y cards)
- After: menos sombra (`shadow-sm` o ninguna), sin `hover:shadow-md`, padding reducido, bordes suaves `border-slate-200`, tipografía compacta, colores neutros (`text-slate-*`) salvo badges estrictamente necesarios.

## Criterios de aceptación
- `data-testid="allergy-alert-banner"` sigue existiendo y muestra “ALERGIAS REGISTRADAS”.
- `data-testid="vital-signs-grid"` sigue existiendo.
- `data-testid="imc-card"`, `vital-card-bp`, `vital-card-weight`, `vital-card-last` siguen presentes.

## Files-to-touch
- `frontend/src/pages/PatientProfile.tsx`
- `frontend/src/components/patients/VitalSignsCards.tsx`
- `docs/specs/slice-05-minimalize-allergy-banner-and-vitals.md`
- `frontend/src/tests/slice-05-minimalize-allergy-banner-and-vitals.test.tsx`

## No-goals
- No tocar backend/DB/auth/CI/CD.
- No refactorizar componentes ni mover lógica.
