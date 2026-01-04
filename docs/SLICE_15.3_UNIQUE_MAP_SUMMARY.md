# SLICE 15.3 - Frontend - Resumen de Implementación

**Estado:** Completado
**Descripción:** Integración de "Mapa Único" en el perfil del médico.

**Cambios Backend:**
- `POST /api/maps`: Ahora realiza UPSERT (Actualiza si existe, Crea si no) basado en el ID del doctor.
- `GET /api/maps`: Retorna directamente el objeto del mapa (o 404 si no configurado), en lugar de una lista.
- `GET /api/print/mapped/{consultation_id}`: Ya no requiere `map_id` explícito; busca automáticamente el mapa del doctor.

**Cambios Frontend:**
- `TalonarioCalibrator.tsx`: Carga automáticamente la configuración existente al montar el componente.
- `ProfileSettings.tsx`: Añadida sección "Mapeo de Talonario A5" que enlaza al calibrador.

**Flujo de Usuario:**
1. Médico va a Perfil -> Configuración.
2. Clic en "Calibrar Talonario".
3. Si ya tiene mapa, lo ve y edita. Si no, empieza de cero.
4. Al guardar, se actualiza su único mapa.
5. Al imprimir consulta (futuro), el sistema usará este mapa automáticamente.
