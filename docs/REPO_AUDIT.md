# REGLA FUNDAMENTAL DE ESTE DOCUMENTO

Todo agente que trabaje sobre este repositorio esta OBLIGADO a:
- Leer este archivo completo antes de tocar cualquier cosa.
- Actualizar este archivo al final de su jornada SI y SOLO SI obtuvo nueva evidencia verificable.

Si algo no esta documentado aqui, se considera que NO existe.

# REPO_AUDIT

Este documento es la fuente de verdad operativa.
Cualquier accion que no este justificada aqui o por comandos verificables debe detenerse y consultarse.

## Regla fundamental (NO ASUMIR)

Si algo no esta demostrado explicitamente por:
- archivos del repositorio,
- configuracion visible del entorno,
- o comandos ejecutables con salida verificable,

entonces NO EXISTE a efectos de este proyecto.

## Regla de actualizacion obligatoria del REPO_AUDIT

### Cuando SI actualizar

- Se confirma o descarta una hipotesis previa.
- Se obtiene evidencia nueva mediante codigo, comandos o infraestructura real.
- Cambia el comportamiento real del sistema (auth, DB, APIs, proveedores, rutas).
- Se detecta una restriccion nueva ("esto NO se debe tocar").

### Cuando NO actualizar

- Cambios esteticos.
- Refactors internos.
- Fixes locales sin impacto sistemico.
- Opiniones, intuiciones o interpretaciones.

### Frecuencia

- No se actualiza continuamente.
- Se revisa al final de cada jornada de trabajo.
- Si no hay nueva evidencia, NO se escribe nada.

### Principio clave

Este documento no sigue al codigo.
Sigue al entendimiento real y verificable del sistema.

## Restricciones operativas (NO hacer sin autorizacion explicita)

- No refactorizar el sistema de autenticacion (Firebase).
- No cambiar esquemas de base de datos.
- No modificar CI/CD ni pipelines de despliegue.
- No mover ni renombrar rutas publicas del backend.
- No asumir comportamiento de infraestructura no documentada.

Cualquier cambio en estos puntos requiere confirmacion humana explicita.

## Estado actual del proyecto (contexto no tecnico)

El sistema esta funcional desde la perspectiva del usuario final:
- La UI web responde correctamente.
- El backend esta desplegado y operativo en Cloud Run.
- El endpoint de diagnostico basado en ICD-11 funciona y devuelve resultados validos.
- La integracion con la API oficial de la OMS (ICD-11) esta operativa.

No existe evidencia en el repositorio de:
- metricas de uptime,
- monitoreo activo,
- alertas,
- ni dashboards de observabilidad.

Este estado se basa en validacion manual y no en metricas instrumentadas.

## Que es este proyecto (resumen breve)

- Evidencia encontrada: Backend FastAPI con entrypoint `app = FastAPI(...)` (`backend/main.py:1,51`).
- Evidencia encontrada: Frontend React con React Router (`frontend/src/App.tsx:1-2`).
- Evidencia encontrada: Auth usa Firebase en frontend y Firebase Admin en backend (`frontend/src/firebase.ts:1-25`, `backend/dependencies.py:6-43`).
- Evidencia encontrada: CI/CD en GitHub Actions con despliegue a Firebase Hosting y Cloud Run (`.github/workflows/pipeline.yml:8-129`, `.github/workflows/firebase-hosting-merge.yml:1-49`, `.github/workflows/deploy-backend.yml:1-77`).
- Evidencia humana: Base de datos en produccion es Neon (PostgreSQL). (Confirmacion directa del humano, 2026-01-22).

### Objetivo del producto (solo evidencia)

- Evidencia encontrada: Rutas UI para login, onboarding, dashboard, pacientes, consultas, ajustes, auditoria y PDF (`frontend/src/App.tsx:5-113`).
- Evidencia encontrada: Endpoints para pacientes, consultas, recetas, verificacion y auditoria (`backend/api/patients.py:32-426`, `backend/api/consultations.py:42-351`, `backend/api/verification.py:13-124`, `backend/api/audit.py:30-82`).
- Evidencia encontrada: Verificacion publica via UUID y descarga PDF (`backend/api/verification.py:13-124`).
- Evidencia encontrada: Diagnostico AI usa OMS ICD-11 (`backend/api/endpoints/diagnosis.py:39-195`).
- Pendiente de verificacion: Proposito final y alcance funcional completo (no hay README ni documento unico de objetivos).

## Arquitectura observada (solo evidencia del repo)

### Estructura del repo (resumen)

Evidencia encontrada (listado parcial del root): `_prod_bundle.js`, `_prod_index.html`, `backend/`, `config/`, `data/`, `docs/`, `frontend/`, `tests/`, `Dockerfile`, `requirements.txt` (salida `ls` root).

### Stack y entrypoints (solo evidencia)

- Backend: FastAPI y Uvicorn (`backend/main.py:1-51`, `backend/Dockerfile:30-31`).
- Frontend: React + Vite (`frontend/src/App.tsx:1-2`, `frontend/package.json:7-8`).
- Base de datos: SQLAlchemy y `DATABASE_URL` (`backend/models.py:1-3`, `.env.example:4-5`).
- Auth: Firebase Auth (frontend) + Firebase Admin (backend) (`frontend/src/firebase.ts:1-25`, `backend/dependencies.py:6-43`, `backend/core/firebase_app.py:9-20`).

### Mapa minimo de entidades/dominios (evidencia)

- User (`users`): `email`, `is_verified`, `professional_name`, `registration_number`, `address`, `phone`, etc. (`backend/models.py:6-24`).
- Patient (`patients`): datos personales, `owner_id` (`backend/models.py:23-67`).
- MedicalBackground (`medical_backgrounds`) (`backend/models.py:69-84`).
- ClinicalConsultation (`clinical_consultations`) (`backend/models.py:86-114`).
- PrescriptionMap (`prescription_maps`) (`backend/models.py:132-149`).
- PrescriptionVerification (`prescription_verifications`) (`backend/models.py:152-173`).
- ClinicalRecord (`clinical_records`) (`backend/models.py:174-194`).

Relaciones:
- Patient -> ClinicalConsultation (1:N) (`backend/models.py:129-130`).
- Patient -> MedicalBackground (1:1) (`backend/models.py:63-64,84`).
- ClinicalConsultation -> PrescriptionVerification (1:1) (`backend/models.py:117-118,171-172`).

### Tabla de endpoints (backend)

Formato: Metodo | Ruta | Handler | Auth requerida | Input/Output

Health:
- GET `/api/health` | `health_check` | No auth | `{status, db}` (`backend/main.py:105-107`).

Diagnostico:
- POST `/api/diagnosis/suggest-cie10` | `suggest_cie10` | No `Depends(get_current_user)` visible | Input `DiagnosisRequest`, Output `DiagnosisResponse` (`backend/api/endpoints/diagnosis.py:31-33,190-196`).

Pacientes (prefijo `/api/patients`):
- POST `/api/patients` | `create_patient` | Auth | Input `PatientCreate`, Output `Patient` (`backend/api/patients.py:32-37`).
- GET `/api/patients/search` | `search_patients` | Auth | Output `PatientSearchResponse` (`backend/api/patients.py:49-54`).
- GET `/api/patients/{patient_id}` | `get_patient_by_id` | Auth | Output `Patient` (`backend/api/patients.py:94-99`).
- PATCH `/api/patients/{patient_id}` | `update_patient` | Auth | Input `PatientUpdate`, Output `Patient` (`backend/api/patients.py:117-123`).
- GET `/api/patients` | `read_patients` | Auth | Output `PatientListResponse` (`backend/api/patients.py:154-161`).
- GET `/api/patients/{patient_id}/clinical-record` | `get_clinical_record` | Auth | Output `ClinicalRecord` (`backend/api/patients.py:213-218`).
- PUT `/api/patients/{patient_id}/clinical-record` | `update_clinical_record` | Auth | Input/Output `ClinicalRecord` (`backend/api/patients.py:244-249`).
- GET `/api/patients/{patient_id}/consultations` | `get_patient_consultations` | Auth | Output `List[ConsultationItemSpanish]` (`backend/api/patients.py:281-286`).
- POST `/api/patients/{patient_id}/consultations` | `create_patient_consultation` | Auth | Input `ConsultationCreate`, Output `ConsultationItem` (`backend/api/patients.py:318-323`).
- POST `/api/patients/consultations/{consultation_id}/prescription` | `create_prescription` | Auth | Input `PrescriptionCreate`, Output `PrescriptionResponse` (`backend/api/patients.py:360-365`).
- GET `/api/patients/prescriptions/{prescription_id}` | `get_prescription` | Auth | Output `PrescriptionResponse` (`backend/api/patients.py:426-431`).

Consultas (prefijo `/api/pacientes/{patient_id}/consultas`):
- POST `/api/pacientes/{patient_id}/consultas` | `create_consultation` | Auth | Input `ConsultationCreate`, Output `ConsultationResponse` (`backend/api/consultations.py:42-48`).
- GET `/api/pacientes/{patient_id}/consultas` | `list_consultations` | Auth | Output `List[ConsultationResponse]` (`backend/api/consultations.py:72-77`).

Consultas (prefijo `/api/consultas`):
- POST `/api/consultas/{consultation_id}/create-verification` | `create_verification` | Auth | Output `{uuid}` (`backend/api/consultations.py:114-119`).
- POST `/api/consultas/{consultation_id}/send-email` | `send_prescription_email` | Auth | Output `{status, message}` (`backend/api/consultations.py:165-171`).
- POST `/api/consultas/{consultation_id}/mark-whatsapp-sent` | `mark_whatsapp_sent` | Auth | Output `{success, timestamp}` (`backend/api/consultations.py:246-252`).
- GET `/api/consultas/{consultation_id}/dispatch-status` | `get_dispatch_status` | Auth | Output `{email_sent_at, whatsapp_sent_at, uuid}` (`backend/api/consultations.py:278-283`).
- GET `/api/consultas/{consultation_id}/pdf` | `get_prescription_pdf` | Auth | Output PDF (`backend/api/consultations.py:310-315`).

Antecedentes (prefijo `/api/medical-background`):
- GET `/api/medical-background/pacientes/{patient_id}/antecedentes` | `get_medical_background` | Auth | Output `MedicalBackgroundResponse` (`backend/api/medical_background.py:12-15,71-76`).
- PUT `/api/medical-background/pacientes/{patient_id}/antecedentes` | `update_medical_background` | Auth | Input `MedicalBackgroundBase`, Output `MedicalBackgroundResponse` (`backend/api/medical_background.py:113-118`).

Doctor (prefijo `/api/doctors`):
- GET `/api/doctors/profile` | `get_profile` | Auth | Output `DoctorProfile` (`backend/api/doctor.py:13-14`).
- POST `/api/doctors/profile` | `create_profile` | Auth | Input `OnboardingUpdate`, Output `DoctorProfile` (`backend/api/doctor.py:40-44`).
- PUT `/api/doctors/profile` | `update_profile` | Auth | Input `UserUpdate`, Output `User` (`backend/api/doctor.py:78-82`).
- POST `/api/doctors/onboarding/complete` | `finalize_onboarding` | Auth | Output `User` (`backend/api/doctor.py:103-107`).
- GET `/api/doctors/dashboard/stats` | `get_dashboard_stats` | Auth | Output `DashboardStats` (`backend/api/doctor.py:137-141`).
- GET `/api/doctors/preferences` | `get_preferences` | Auth | Output JSON stub (`backend/api/doctor.py:234-235`).
- PUT `/api/doctors/preferences` | `update_preferences` | Auth | Output `{status, received}` (`backend/api/doctor.py:249-254`).

Usuario (prefijo `/api/users`):
- PUT `/api/users/onboarding` | `update_onboarding_profile` | Auth | Input `OnboardingUpdate`, Output `OnboardingUpdate` (`backend/api/user.py:13-18`).

Auditoria (prefijo `/api/audit`):
- GET `/api/audit/dispatch-summary` | `get_dispatch_summary` | Auth | Output `DispatchAuditResponse` (`backend/api/audit.py:30-37`).

Portabilidad (prefijo `/api/data`):
- GET `/api/data/export` | `export_data` | Auth | Output ZIP (`backend/api/endpoints/portability.py:13-24`).
- POST `/api/data/import` | `import_data` | Auth | Input `UploadFile`, Output stats (`backend/api/endpoints/portability.py:28-40`).

Mapeo recetas (prefijo `/api/maps`):
- GET `/api/maps` | `get_maps` | Auth | Output `List[PrescriptionMapResponse]` (`backend/api/maps.py:33-38`).
- GET `/api/maps/current` | `get_current_map` | Auth | Output `PrescriptionMapResponse` (`backend/api/maps.py:45-49`).
- POST `/api/maps` | `create_or_update_map` | Auth | Input `PrescriptionMapCreate`, Output `PrescriptionMapResponse` (`backend/api/maps.py:60-78`).

Seguridad:
- DELETE `/api/users/me` | `delete_account` | Auth | Input `confirmation_phrase` | Output message (`backend/api/endpoints/user_deletion.py:11-15`).

Verificacion publica (router definido, NO incluido en main):
- GET `/v/{verification_uuid}` | `verify_prescription` | Sin auth | Output JSON publico (`backend/api/verification.py:13-46`).
- GET `/v/{verification_uuid}/pdf` | `download_prescription_pdf` | Sin auth | Output PDF (`backend/api/verification.py:50-124`).

### Variables de entorno detectadas (solo evidencia)

Backend:
- `DATABASE_URL` (`.env.example:4-5`, `verify_db_schema.py:9`).
- `SECRET_KEY` (`.env.example:10-11`, `backend/auth.py:11`).
- `FEATURE_FLAGS_JSON` (`backend/api/medical_background.py:44-45`).
- `ICD_RELEASE`, `ICD_CLIENT_ID`, `ICD_CLIENT_SECRET` (`backend/api/endpoints/diagnosis.py:40,66-67`).
- `BASE_URL` (`backend/api/consultations.py:221-223`).
- `ENVIRONMENT`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `FRONTEND_URL` (`.github/workflows/deploy-backend.yml:63`).

Frontend:
- `VITE_API_URL` (`frontend/src/config/api.ts:2-6`).
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` (`frontend/src/firebase.ts:5-12`).

### Inconsistencias (evidencia)

- Dos Dockerfiles con Python distinto: root `python:3.9-slim-bookworm` vs backend `python:3.10-slim` (`Dockerfile:1`, `backend/Dockerfile:2`).
- Endpoint PDF duplicado: `/api/consultas/{id}/pdf` existe en `backend/api/consultations.py` y `backend/api/print.py`, pero `print.py` no esta incluido en `backend/main.py` (`backend/api/consultations.py:310-315`, `backend/api/print.py:9-16`, `backend/main.py:93-103`).
- Router `/v/*` definido pero no incluido en main (`backend/api/verification.py:7-10`, `backend/main.py:93-103`).
- Imports inconsistentes sin prefijo `backend` en `verification.py`, `print.py`, `maps.py` (`backend/api/verification.py:4-6`, `backend/api/print.py:4-7`, `backend/api/maps.py:7-9`).

## Flujos principales (frontend -> backend -> servicios externos)

Nota: Se requiere token Firebase valido. No hay endpoint de login en backend.

1) Diagnostico ICD
```bash
curl -X POST "<API_BASE_URL>/api/diagnosis/suggest-cie10" \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"text":"dolor lumbar"}'
```
Contrato: request `{"text":...}` y response `{"suggestions": [...]}` (`backend/api/endpoints/diagnosis.py:31-33,190-196`).

2) Crear paciente
```bash
curl -X POST "<API_BASE_URL>/api/patients" \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana","apellido_paterno":"Lopez","dni":"123","fecha_nacimiento":"1990-01-01","sexo":"F"}'
```
Endpoint requiere auth (`backend/api/patients.py:32-37`).

3) Crear consulta (ruta usada por frontend)
```bash
curl -X POST "<API_BASE_URL>/api/patients/<PATIENT_ID>/consultations" \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"consulta","diagnosis":"dx","treatment":"tx","notes":"..."}'
```
Endpoint y schema (`backend/api/patients.py:318-323`, `backend/schemas/consultations.py:5-12`).

Errores comunes (evidencia): 401 por token invalido (`backend/dependencies.py:27-56`), 404 por paciente ajeno (`backend/api/patients.py:90-107`), 400/503 en ICD (`backend/api/endpoints/diagnosis.py:69-91,191-193`).

## Integraciones externas (solo evidencia)

### Autenticacion end-to-end (evidencia)

Frontend:
- Firebase init con `VITE_FIREBASE_*` (`frontend/src/firebase.ts:1-25`).
- Login con `signInWithEmailAndPassword` (`frontend/src/context/DoctorContext.tsx:3-4,104-105`).
- Token con `user.getIdToken()` (`frontend/src/hooks/useAuthFetch.ts:25-34`).
- Header `Authorization: Bearer` en `createAuthFetch` (`frontend/src/lib/authFetch.ts:54-61`).

Backend:
- Verificacion token con `firebase_auth.verify_id_token` (`backend/dependencies.py:36-43`).
- Guard `get_current_user` depende de `verify_firebase_token` (`backend/dependencies.py:59-63`).
- Inicializacion Firebase Admin (`backend/main.py:44-47`, `backend/core/firebase_app.py:9-20`).

### ICD-11 (OMS) implementacion actual

- Endpoint: `POST /api/diagnosis/suggest-cie10` (`backend/api/endpoints/diagnosis.py:190-196`).
- Token cache: `_WHO_TOKEN` y `_WHO_TOKEN_EXP` (`backend/api/endpoints/diagnosis.py:43-45`).
- Token URL OMS: `https://icdaccessmanagement.who.int/connect/token` (`backend/api/endpoints/diagnosis.py:39`).
- Headers OMS: `Authorization: Bearer`, `API-Version: v2`, `Accept-Language: es` (`backend/api/endpoints/diagnosis.py:114-118`).
- Errores: 400 texto corto, 503 por credenciales o OMS (`backend/api/endpoints/diagnosis.py:69-91,191-193,124-127`).
- Response: `DiagnosisResponse` con `suggestions` list de `{code, description, relevance_reason}` (`backend/api/endpoints/diagnosis.py:23-30,177-181`).
- Pendiente: no hay manejo explicito de 429/401 OMS (solo 503 generico).

### Firebase Storage (evidencia manual)

- Bucket Firebase Storage activo: `vitalinuage.firebasestorage.app` (consola Firebase Storage, 2026-01-22).
- Reglas aplicadas: lectura/escritura solo owner en `profiles/{uid}/avatar` y `profiles/{uid}/signature`, con limites de tamano y content-type `image/*`. (consola Firebase Storage, 2026-01-22).
- CORS aplicado en bucket para `https://vitalinuage.web.app` (gsutil cors set, 2026-01-22).
- Requisito de privacidad (evidencia humana): firma no es publica; solo se usa dentro del PDF generado por el sistema. (Confirmacion directa del humano, 2026-01-22).
- Logo de impresion guarda en Storage: ruta `print-logos/{uid}/logo` (frontend `PrintSettingsModal`). Regla requerida para upload/lectura solo owner. (UI + reglas, 2026-01-22).

### Signos vitales en consultas (evidencia manual)

- POST `/api/patients/{id}/consultations` persiste `peso_kg`, `estatura_cm`, `imc`, `presion_arterial`, `frecuencia_cardiaca`, `temperatura_c`. (verificacion manual UI + respuesta API, 2026-01-22).

### Talonario / Mapas de impresion (evidencia manual)

- Editor `/settings/talonario` habilitado por flag `prescription_coords_v1`. (UI + feature flag, 2026-01-22).
- API de mapas expuesta: `GET /api/maps`, `GET /api/maps/current`, `POST /api/maps`. (backend `backend/api/maps.py`, 2026-01-22).
- PDF usa mapa activo si existe (ReportLab). (backend `backend/services/pdf_service.py`, 2026-01-22).

### Preferencias de impresion (evidencia manual)

- Persistencia en `users.print_*` (paper_size, template_id, header_text, footer_text, primary_color, secondary_color, logo_path). (backend `backend/models.py`, 2026-01-22).
- Endpoints `GET/PUT /api/doctors/preferences` guardan y devuelven preferencias. (backend `backend/api/doctor.py`, 2026-01-22).
- Template HTML usa logo y colores cuando hay preferencias. (backend `backend/templates/recipe_template.html`, 2026-01-22).

## CI/CD y despliegue (solo evidencia)

- Pipeline con lint + deploy frontend y backend (`.github/workflows/pipeline.yml:8-129`).
- Frontend: `npm ci` + `npm run build` + deploy Firebase Hosting (`.github/workflows/pipeline.yml:41-79`, `.github/workflows/firebase-hosting-merge.yml:12-49`).
- Backend: build Docker + push Artifact Registry + deploy Cloud Run (`.github/workflows/pipeline.yml:112-125`, `.github/workflows/deploy-backend.yml:38-64`).
- Secrets pipeline: `VITE_FIREBASE_*`, `VITE_API_URL`, `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_ORIGINS`, `GCP_SA_KEY`, `GCP_PROJECT_ID`, `GCP_REPOSITORY` (`.github/workflows/pipeline.yml:44-51,95-129`).
- Secrets deploy-backend: `GCP_PROJECT_ID`, `GCP_SA_KEY`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `FRONTEND_URL` (`.github/workflows/deploy-backend.yml:12-63`).

## Preguntas abiertas / pendientes de confirmacion

### Guardrail "No asumir" (tabla)

| Tema | Lo que se sabe (evidencia) | Lo que NO se sabe | Como verificar |
| --- | --- | --- | --- |
| DB en produccion | Neon (PostgreSQL) confirmado por humano (2026-01-22) | Host y permisos exactos en prod | Revisar config de Cloud Run y conexion real |
| Auth | Firebase Auth + Admin (`frontend/src/firebase.ts:1-25`, `backend/dependencies.py:6-43`) | Proyecto Firebase exacto en prod | Revisar consola Firebase y secrets |
| Router publico `/v/*` | Router existe (`backend/api/verification.py:7-124`) | Si se expone en prod | Confirmar `include_router`/gateway |
| Dockerfile usado | Hay dos Dockerfiles (`Dockerfile:1`, `backend/Dockerfile:2`) | Cual se usa en prod | Ver workflow real of build |
| ICD credenciales | `ICD_*` existen (`backend/api/endpoints/diagnosis.py:40,66-67`) | Si estan configuradas | Revisar secretos/env en deploy |

### Cosas que NO se pueden afirmar con evidencia actual

- Host exacto y permisos de la DB en produccion (confirmado Neon, pero no mas detalles).
- Que `/v/*` esta expuesto en prod (no se incluye en `backend/main.py`).
- Que `/api/diagnosis/suggest-cie10` exige auth (no hay `Depends` en backend).
- Que `vitalinuage.db` se usa en runtime (archivo existe pero no hay referencia en codigo).

### Preguntas necesarias al humano

- Que DB se usa en produccion (motor y host)?
- Se expone `/v/*` en prod o hay un gateway externo?
- Donde se inyectan `ICD_CLIENT_ID/ICD_CLIENT_SECRET`?
- Se usa el Dockerfile root o `backend/Dockerfile` para despliegue?

## Checklist operativo para nuevos agentes

### Backend

- Instalar deps: `pip install -r backend/requirements.txt` (`backend/Dockerfile:19-21`).
- Entrypoint: `uvicorn main:app --host 0.0.0.0 --port 8080` (`backend/Dockerfile:30-31`).
- Inicializacion: crea tablas y Firebase Admin si no hay `PYTEST_CURRENT_TEST` (`backend/main.py:40-47`).
- Env minima de ejemplo: `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`, `RESEND_API_KEY` (`.env.example:4-14`).

### Frontend

- Instalar deps: `npm ci` (`frontend/package.json:7-11`, `.github/workflows/pipeline.yml:41-54`).
- Dev server: `npm run dev` (`frontend/package.json:7-8`).
- Build: `npm run build` (`frontend/package.json:8-10`).
- Env requerida: `VITE_FIREBASE_*` y `VITE_API_URL` (`frontend/src/firebase.ts:5-21`, `frontend/src/config/api.ts:2-6`).

### Tests y lint

- Pytest backend: `pytest` con addopts en `pytest.ini` (`pytest.ini:1-4`).
- Jest frontend: `npm test` (`frontend/package.json:11`).
- Lint backend: `flake8 backend` en pipeline (`.github/workflows/pipeline.yml:18-22`).

## Incidencias conocidas y solucionadas

### Paginacion de Pacientes (Loop Infinito)
- **Sintoma:** Al cambiar a la pagina 2, la UI revertia inmediatamente a la pagina 1.
- **Causa:** El hook `usePatientsList` devolvia un objeto no memoizado con un callback `setSearch` inestable. Esto disparaba un `useEffect` de busqueda en `PatientTable` tras cada render (incluyendo cambios de pagina), ejecutando un debounce que reseteaba la pagina a 1.
- **Solucion:** Memoizacion completa del hook `usePatientsList` (`useCallback`, `useMemo`) y guardas en el `useEffect` de `PatientTable` para evitar ejecuciones si el termino de busqueda no ha cambiado. (Solucionado: 2026-01-26).

### Feedback Visual en Paginacion
- **Objetivo:** Evitar incertidumbre del usuario durante el fetch de datos al cambiar de pagina.
- **Solucion:** Implementacion de PatientRowSkeleton (+ animate-pulse) que reemplaza las filas reales en PatientTable mientras isLoading es true. Controles de paginacion se deshabilitan inmediatamente para evitar peticiones concurrentes descontroladas. (Implementado: 2026-01-26).
