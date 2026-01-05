# Diagnóstico de Funcionalidades Existentes (Identidad y Búsqueda)

## 1. Identidad del Médico ("Buenos días, Dr. Vitali")

**Estado Actual:** Incompleto / Mocked en Frontend.

*   **Frontend**:
    *   El saludo dinámico (`Buenos días/tardes`) funciona correctamente (`Search.tsx`).
    *   El nombre "Dr. Vitali" es un valor por defecto en `DoctorContext.tsx` porque la llamada a la API falla.
    *   El frontend intenta consultar `GET /api/doctor/profile` y `/api/doctor/preferences`.

*   **Backend**:
    *   **NO EXISTE** el endpoint `/api/doctor`.
    *   **Falta Schema**: La tabla `users` (`models.py`) solo tiene credenciales (`email`, `password`) y verificación. Faltan campos de perfil (`nombre_profesional`, `especialidad`, `matricula`).
    *   **Falla Silenciosa**: El frontend captura el error de red y usa los valores por defecto sin alertar.

**Qué falta implementar:**
1.  **Modelo de Datos**: Crear tabla `doctor_profiles` (1:1 con `users`) o extender `users`.
2.  **API**: Crear router `api/doctor.py` con endpoints `GET/PUT /profile`.
3.  **Migración**: Actualizar la base de datos Neon.

## 2. Motor de Búsqueda de Pacientes

**Estado Actual:** Incompleto / Endpoint no existe.

*   **Frontend**:
    *   El componente `Search.tsx` está listo y hace una petición a `/api/pacientes/search?q={query}`.
    *   Espera un array de resultados con `{id, nombre_completo, dni, imc}`.

*   **Backend**:
    *   El router `api/patients.py` existe pero solo tiene `CREATE` y `LIST ALL`.
    *   **NO EXISTE** el endpoint `/search`.
    *   Por tanto, la búsqueda devuelve 404 y no muestra resultados.

*   **Base de Datos**:
    *   La tabla `patients` tiene los campos necesarios (`nombre`, `apellido_paterno`, `dni`) indexados, lo que permitirá una búsqueda eficiente.

**Qué falta implementar:**
1.  **Endpoint**: Implementar `GET /api/pacientes/search` en `backend/api/patients.py`.
2.  **Lógica SQL**: Implementar filtro `OR` (nombre ILIKE %q% OR apellido ILIKE %q% OR dni ILIKE %q%).
3.  **Serialización**: Asegurar que el backend devuelva el formato JSON que espera el frontend (`nombre_completo` concatenado).

## 3. Conclusión

Ninguna de las dos funcionalidades está operativa en el backend. El frontend está listo ("Disconnected UI"), pero el backend no tiene la lógica para soportarlas.
