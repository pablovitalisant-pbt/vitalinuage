# VITALINUAGE: Script de Despliegue Profesional v1.5.5
# Este script sube tu codigo a Google Cloud Run utilizando Google Cloud Build.

$PROJECT_ID = "vitalinuage-backend"
$SERVICE_NAME = "vitalinuage-backend"
$REGION = "us-central1"

Write-Host "--- Iniciando Despliegue PBT-IA: Vitalinuage ---" -ForegroundColor Cyan

# 1. Verificación de configuración del proyecto
Write-Host "[1/3] Configurando el proyecto en Google Cloud: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 2. Construcción de la imagen en la nube (Evita problemas de Docker local)
Write-Host "[2/3] Subiendo codigo y construyendo imagen en Google Cloud Build..."
# Este comando empaqueta el directorio actual y lo sube para ser procesado por Google.
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME .

# 3. Despliegue y actualización del servicio en Cloud Run
Write-Host "[3/3] Actualizando servicio en Cloud Run..."
gcloud run deploy $SERVICE_NAME `
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars "ENV=production"

Write-Host "--- Despliegue Completado con Exito ---" -ForegroundColor Green
Write-Host "Verifica la URL proporcionada por Google para confirmar que el error ha desaparecido."