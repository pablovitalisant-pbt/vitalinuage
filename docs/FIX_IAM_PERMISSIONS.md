# Comandos para Configurar Permisos de IAM - GitHub Actions Deployer

## EJECUTAR ESTOS COMANDOS EN GOOGLE CLOUD SHELL

### 1. Configurar Variables
```bash
export PROJECT_ID=$(gcloud config get-value project)
export SA_EMAIL="github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
export COMPUTE_SA="${PROJECT_ID}-compute@developer.gserviceaccount.com"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
```

### 2. Asignar Roles al Service Account de GitHub Actions
```bash
# Cloud Run Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

# Artifact Registry Writer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Service Account User (CRÍTICO)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Storage Admin (para logs y artifacts)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

# Cloud Build Editor (para construir imágenes)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudbuild.builds.editor"
```

### 3. CRÍTICO: Permitir que GitHub Actions actúe como la Service Account de Compute
```bash
# Permitir que github-actions-deployer actúe como la SA de Compute Engine
gcloud iam service-accounts add-iam-policy-binding \
  ${COMPUTE_SA} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# También permitir actuar como sí mismo
gcloud iam service-accounts add-iam-policy-binding \
  ${SA_EMAIL} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

### 4. Verificar Permisos
```bash
# Ver todos los roles asignados al SA de GitHub Actions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SA_EMAIL}" \
  --format="table(bindings.role)"

# Ver quién puede actuar como la SA de Compute
gcloud iam service-accounts get-iam-policy ${COMPUTE_SA}
```

### 5. Habilitar APIs Necesarias
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable compute.googleapis.com
```

### 6. Crear Artifact Registry (si no existe)
```bash
gcloud artifacts repositories create vitalinuage \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for Vitalinuage backend" \
  || echo "Repository already exists"
```

### 7. Verificar que todo esté listo
```bash
echo "Project ID: $PROJECT_ID"
echo "GitHub SA: $SA_EMAIL"
echo "Compute SA: $COMPUTE_SA"
echo ""
echo "Verificando permisos..."
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SA_EMAIL}"
```

## TROUBLESHOOTING

### Error: "Permission denied to act as service account"
**Solución:** Ejecutar el comando del paso 3 nuevamente

### Error: "Repository not found"
**Solución:** Ejecutar el comando del paso 6

### Error: "API not enabled"
**Solución:** Ejecutar todos los comandos del paso 5

### Verificar que el secreto GCP_SA_KEY esté configurado
1. Ir a GitHub → Settings → Secrets and variables → Actions
2. Verificar que existe `GCP_SA_KEY`
3. Verificar que existe `GCP_PROJECT_ID`

## REGENERAR CLAVE SI ES NECESARIO
```bash
# Solo si necesitas regenerar la clave
gcloud iam service-accounts keys create github-sa-key.json \
  --iam-account="${SA_EMAIL}"

# Mostrar contenido para copiar a GitHub
cat github-sa-key.json

# IMPORTANTE: Eliminar después de copiar
rm github-sa-key.json
```
