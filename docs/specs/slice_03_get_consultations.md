# SPEC SLICE 03: Visualización de Consultas (GET)
**Estado:** Fase A (Contrato Actualizado)
**Slice:** 03 - Vertical Slice

## 2. CONTRATO EJECUTABLE (Alineado con UI)
- **Ruta:** GET /api/consultations
- **Response:** 200 OK -> List[ConsultationItemSpanish]
- **Campos:** motivo_consulta, diagnostico, plan_tratamiento, fecha.
