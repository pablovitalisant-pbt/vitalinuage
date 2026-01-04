# Reglas del Workspace - Protocolo PBT-IA

Estas reglas son OBLIGATORIAS para todo el ciclo de desarrollo en este workspace.

1. **NO modifiques nada fuera de los FILES-TO-TOUCH definidos.**
2. **Toda nueva funcionalidad debe entregarse en formato DIFF unificado.**
3. **Cada slice debe ser vertical (DB-API-UI-Test) y menor a 200 líneas.**
4. **Respeta los contratos ejecutables (Zod/Pydantic) definidos en el PRD o specs.**
5. **Toda feature nace con Feature Flag OFF en config/feature-flags.json.**
