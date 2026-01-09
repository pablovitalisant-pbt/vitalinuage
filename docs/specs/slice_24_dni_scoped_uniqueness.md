# Slice 24: Manejo de DNI por Médico (Scoped Uniqueness)

## 1. LA REGLA DE NEGOCIO
**Restricción:** Un médico NO puede registrar dos pacientes con el mismo DNI.
**Permisividad:** Dos médicos distintos SÍ pueden tener registrado al mismo paciente (mismo DNI) en sus respectivas carteras.

## 2. EL PROBLEMA TÉCNICO
Actualmente, `ix_patients_dni` (o `dni` con `unique=True`) impone unicidad global.
Esto provoca `IntegrityError` (500) cuando un segundo médico intenta registrar un DNI existente.

## 3. SOLUCIÓN PROPUESTA
1.  **DB Migration:** Eliminar índice único global en `dni`.
2.  **DB Constraint:** Crear `UniqueConstraint(dni, owner_id)`.
3.  **Backend Logic:** Manejar `IntegrityError` en `POST /patients` y `PATCH /patients` para retornar `409 Conflict`.

## 4. CRITERIOS DE ACEPTACIÓN
- [ ] Médico A registra DNI 123 -> **201 Created**.
- [ ] Médico A intenta registrar DNI 123 de nuevo -> **409 Conflict** ("Ya tienes un paciente registrado con este DNI").
- [ ] Médico B registra DNI 123 -> **201 Created**.
