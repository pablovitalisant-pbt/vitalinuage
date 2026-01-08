# Especificación de Despliegue Real v1.6.0

## 1. Autenticación (Google Cloud Auth)
El pipeline **DEBE** autenticarse de forma segura contra Google Cloud Platform antes de realizar operaciones de registro o despliegue.

- **Acción Requerida:** `google-github-actions/auth`.
- **Mecanismo:** Se utilizará un `credentials_json` almacenado en Secrets de GitHub (`GCP_SA_KEY`) o Workload Identity Federation (preferible si está configurado).
- **Propósito:** Permitir el acceso a Artifact Registry y Cloud Run API.

## 2. Registro de Imágenes (Artifact Registry)
La imagen Docker construida en el paso anterior debe ser persistida en un registro seguro.

- **Registro Destino:** Google Artifact Registry (GAR).
- **Región:** `us-central1`.
- **Formato de Tag:** `us-central1-docker.pkg.dev/[PROJECT_ID]/[REPOSITORY]/vitalinuage-backend:[SHA]`.
- **Pasos de CI:**
  1. **Autenticación Docker:** `gcloud auth configure-docker us-central1-docker.pkg.dev`.
  2. **Tag:** Etiquetar la imagen local `vitalinuage-app` con la ruta remota.
  3. **Push:** Subir la imagen al repositorio remoto.

## 3. Comando de Despliegue (Cloud Run)
El despliegue final se realizará utilizando la imagen subida, reemplazando el placeholder actual.

- **Acción Requerida:** `google-github-actions/deploy-cloudrun`.
- **Parámetros Obligatorios:**
  - `service`: `vitalinuage-backend`
  - `image`: (La imagen subida en el paso anterior)
  - `region`: `us-central1`
  - `env_vars`: Definición de variables de entorno críticas (DATABASE_URL, etc., inyectadas desde Secrets).

## 4. Criterios de Aceptación
1. **Estado del Servicio:** La revisión de Cloud Run debe reportar estado "Healthy" (Verde).
2. **Disponibilidad:** El endpoint `/api/health` debe responder `200 OK` tras el despliegue.
3. **Integridad:** El logs de despliegue no debe mostrar errores de autenticación o permisos.
