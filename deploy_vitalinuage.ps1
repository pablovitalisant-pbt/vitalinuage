# VITALINUAGE: Script de Despliegue Maestro v2.3
# Blindaje contra caracteres especiales (&) y sincronización de Logs

$PROJECT_ID = "vitalinuage"
$SERVICE_NAME = "vitalinuage-backend"
$REGION = "us-central1"

# --- URL DE NEON (ENVUELTA EN COMILLAS SIMPLES PARA EVITAR CORTES) ---
$DATABASE_URL = 'postgresql://neondb_owner:npg_7SILaeFMuf2i@ep-billowing-wave-ac7gg2nq-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Nueva clave para verificar que el cambio surta efecto
$SECRET_KEY = "v1t4l1nu4g3_pbt_secure_key_2026_fixed" 

Write-Host "--- Iniciando Despliegue Maestro v2.3 (Full Escape) ---" -ForegroundColor Cyan

# 1. Configuración
gcloud config set project $PROJECT_ID

# 2. Construcción
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME .

# 3. Despliegue con escape de variables
# Usamos el formato "KEY=VALUE" con comillas dobles para asegurar la inyección
Write-Host "[3/3] Inyectando variables y forzando revisión 00040+ ..."
gcloud run deploy $SERVICE_NAME `
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --timeout=300 `
    --set-env-vars "DATABASE_URL=$DATABASE_URL,SECRET_KEY=$SECRET_KEY,ENV=production,CORS_ORIGINS=*,ALGORITHM=HS256"

Write-Host "--- DESPLIEGUE v2.3 COMPLETADO ---" -ForegroundColor Green
Write-Host "IMPORTANTE: Refresca el Dashboard y mira los logs de las 20:40 en adelante."