### [PROTOCOLO PBT-IA] - SLICE [SP-01] - ETAPA 1: PLANIFICACIÓN

**1. CONTEXTO ACTUAL:**
- **Estado Encontrado:** Tras inspeccionar `backend/api/patients.py`, se observa que el endpoint `PATCH /{patient_id}` **ya existe** en el código fuente (líneas 102-130), utilizando el esquema `PatientUpdate`.
- **Discrepancia:** El reporte de usuario indica `405 Method Not Allowed`, lo que sugiere que el despliegue podría estar desactualizado o existe un conflicto de enrutamiento no evidente.
- **Acción:** Procederemos con un enfoque de "Verificación y Refinamiento" (Slice Polish), creando una prueba de regresión estricta para validar la funcionalidad.

**2. DEFINICIÓN DE ÉXITO:**
- Al finalizar este slice, el sistema debe pasar un nuevo test de integración (`test_patient_update.py`) que confirme:
    1. Actualización parcial exitosa (Status 200) enviando solo un subconjunto de campos JSON.
    2. Persistencia correcta en la base de datos sin alterar los campos no enviados.
    3. Respuesta consistente con el contrato `PatientUpdate`.

**3. REQUERIMIENTO DE CONTRATOS:**
- **Backend Schema (`backend/schemas/patients_schema.py`):**
    - Clase: `PatientUpdate`.
    - Configuración: Todos los campos deben ser `Optional`.
    - Uso: El controlador debe usar `.model_dump(exclude_unset=True)` (ya implementado, sujeto a verificación).
- **Frontend:**
    - No requiere cambios de componente, solo validación de consumo API.

**4. PLAN DE EJECUCIÓN (ALGORITMO):**

1.  **PASO_01 (TESTING):** Crear `backend/tests/test_patient_update.py` implementando un caso de uso de "Update Parcial" (ej. cambiar solo teléfono y email).
2.  **PASO_02 (VALIDACIÓN):** Ejecutar el test. 
    - Si VERDE: El error 405 fue ambiental; el código es correcto.
    - Si ROJO: Diagnosticar y corregir `backend/api/patients.py`.
3.  **PASO_03 (REVISIÓN DE CAMPOS):** Verificar que `PatientUpdate` cubra la totalidad de columnas editables de `models.Patient`.
