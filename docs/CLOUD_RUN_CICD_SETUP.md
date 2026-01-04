# Guía de Configuración: CI/CD Backend → Cloud Run

## Secretos Requeridos en GitHub

Debes configurar los siguientes secretos en: **Settings → Secrets and variables → Actions**

### 1. `GCP_PROJECT_ID`
- **Valor:** El ID de tu proyecto de Google Cloud (ej: `vitalinuage`)
- **Cómo obtenerlo:** 
  ```bash
  gcloud config get-value project
  ```

### 2. `GCP_SA_KEY`
- **Valor:** La clave JSON del Service Account
- **Cómo obtenerla:**

#### Paso 1: Crear Service Account
```bash
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"
```

#### Paso 2: Asignar Roles Necesarios
```bash
# Proyecto ID
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Roles requeridos
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"
```

#### Paso 3: Generar Clave JSON
```bash
gcloud iam service-accounts keys create github-sa-key.json \
  --iam-account="${SA_EMAIL}"
```

#### Paso 4: Copiar el contenido del archivo
```bash
cat github-sa-key.json
```
Copia TODO el contenido JSON y pégalo en el secreto `GCP_SA_KEY` en GitHub.

⚠️ **IMPORTANTE:** Elimina el archivo local después:
```bash
rm github-sa-key.json
```

---

## Roles de IAM Necesarios (Resumen)

El Service Account necesita los siguientes roles:

| Rol | Propósito |
|-----|-----------|
| `roles/run.admin` | Crear y actualizar servicios de Cloud Run |
| `roles/artifactregistry.writer` | Subir imágenes Docker al Artifact Registry |
| `roles/iam.serviceAccountUser` | Actuar como Service Account de Cloud Run |
| `roles/storage.admin` | Acceso a Cloud Storage (si es necesario) |

---

## Configuración Previa en Google Cloud

### 1. Habilitar APIs necesarias
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Crear Artifact Registry (si no existe)
```bash
gcloud artifacts repositories create vitalinuage \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for Vitalinuage"
```

### 3. Verificar que el servicio Cloud Run existe
```bash
gcloud run services describe vitalinuage-backend --region=us-central1
```

Si no existe, el workflow lo creará automáticamente en el primer despliegue.

---

## Verificación del Workflow

Una vez configurados los secretos:

1. Haz un push a `main` con cambios en la carpeta `backend/`
2. Ve a **Actions** en GitHub para ver el progreso
3. El workflow:
   - ✅ Construirá la imagen Docker
   - ✅ La subirá a Artifact Registry
   - ✅ Desplegará a Cloud Run
   - ✅ Mostrará la URL del servicio desplegado

---

## Troubleshooting

### Error: "Permission denied"
- Verifica que el Service Account tenga todos los roles listados
- Espera 1-2 minutos después de asignar roles (propagación de permisos)

### Error: "Repository not found"
- Crea el Artifact Registry manualmente (ver paso 2 arriba)

### Error: "Service not found"
- El workflow creará el servicio automáticamente
- Asegúrate de que `REGION` coincida con tu configuración

---

## Variables de Entorno del Workflow

Puedes modificar estas variables en el archivo `.github/workflows/deploy-backend.yml`:

- `SERVICE_NAME`: Nombre del servicio en Cloud Run (default: `vitalinuage-backend`)
- `REGION`: Región de despliegue (default: `us-central1`)
- `REGISTRY`: URL del Artifact Registry (default: `us-central1-docker.pkg.dev`)

---

## Próximos Pasos

1. Configura los secretos en GitHub
2. Haz push de este workflow a `main`
3. Verifica que el despliegue sea exitoso
4. Actualiza la URL del backend en el frontend si cambió
