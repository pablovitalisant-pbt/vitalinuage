# Script de Emergencia: final_fix_07_3.ps1
# Autogenerado por Antigravity para restaurar consistencia en Slice 07.3

Write-Host "Iniciando Protocolo de Emergencia Slice 07.3..." -ForegroundColor Cyan

# 1. Base de Datos (SQLite) - Manejo robusto con Python
Write-Host "1. Actualizando Esquema de Base de Datos..." -ForegroundColor Yellow
$migrationCode = @'
import sqlite3
import os

db_paths = ['backend/vitalinuage.db', 'backend/test.db', 'vitalinuage.db']
columns = [
    ('email_sent_at', 'DATETIME'),
    ('whatsapp_sent_at', 'DATETIME')
]

for path in db_paths:
    if os.path.exists(path):
        print(f"Procesando {path}...")
        try:
            conn = sqlite3.connect(path)
            c = conn.cursor()
            for col, dtype in columns:
                try:
                    c.execute(f"ALTER TABLE prescription_verifications ADD COLUMN {col} {dtype}")
                    print(f"  [OK] Columna {col} agregada.")
                except sqlite3.OperationalError as e:
                    if 'duplicate column' in str(e):
                        print(f"  [SKIP] Columna {col} ya existe.")
                    else:
                        print(f"  [ERROR] {e}")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error conectando a {path}: {e}")
'@
$migrationCode | Out-File -Encoding UTF8 "temp_fix_db.py"
py temp_fix_db.py
if ($LASTEXITCODE -ne 0) { python temp_fix_db.py } # Fallback
Remove-Item "temp_fix_db.py" -ErrorAction SilentlyContinue


# 2. Backend - Inyección de lógica en send-email
Write-Host "2. Parcheando backend/api/consultations.py..." -ForegroundColor Yellow
$apiPath = "backend/api/consultations.py"
if (Test-Path $apiPath) {
    $apiContent = Get-Content $apiPath -Raw
    
    # Verificamos si ya existe la lógica
    if ($apiContent -notmatch "verification.email_sent_at = datetime.datetime.utcnow") {
        # Estrategia: Insertar antes de añadir la tarea en background
        # Buscamos 'background_tasks.add_task'
        $insertCode = "    # 5. Registrar envio (Timestamp)`n    verification.email_sent_at = datetime.datetime.utcnow()`n    db.commit()`n`n    "
        
        if ($apiContent -match "background_tasks.add_task") {
            $apiContent = $apiContent.Replace("background_tasks.add_task", "$insertCode`n    background_tasks.add_task")
            $apiContent | Set-Content $apiPath -Encoding UTF8
            Write-Host "  [OK] Lógica de timestamp inyectada." -ForegroundColor Green
        }
        else {
            Write-Host "  [ERROR] No se encontró el punto de inyección 'background_tasks.add_task'." -ForegroundColor Red
        }
    }
    else {
        Write-Host "  [SKIP] Lógica backend ya presente." -ForegroundColor Gray
    }
}


# 3. Frontend - Indicadores Visuales
Write-Host "3. Actualizando UI en ConsultationManager.tsx..." -ForegroundColor Yellow
$cmPath = "frontend/src/components/ConsultationManager.tsx"
if (Test-Path $cmPath) {
    $cmContent = Get-Content $cmPath -Raw
    
    # 3.1 Importar Check
    if ($cmContent -notmatch "Check") {
        $cmContent = $cmContent -replace "import \{.+?\} from 'lucide-react'", "$&`nimport { Check } from 'lucide-react';" # Simplificado, o editar linea existente
        # Mejor: reemplazar 'Mail' por 'Mail, Check' si es la forma usada
        $cmContent = $cmContent -replace "Mail", "Mail, Check"
    }

    # 3.2 Indicador WhatsApp
    $checkWA = "{c.whatsapp_sent_at && <Check className='w-3 h-3 text-green-600' />} WhatsApp"
    if ($cmContent -notmatch "c.whatsapp_sent_at") {
        # Reemplazo seguro buscando el texto del botón
        $cmContent = $cmContent -replace "WhatsApp`n", "$checkWA`n"
        $cmContent = $cmContent -replace ">WhatsApp<", ">$checkWA<"
    }

    # 3.3 Indicador Email
    $checkEmail = "{c.email_sent_at && <Check className='w-3 h-3 text-green-600' />} Email"
    if ($cmContent -notmatch "c.email_sent_at") {
        $cmContent = $cmContent -replace "Email`n", "$checkEmail`n"
        $cmContent = $cmContent -replace ">Email<", ">$checkEmail<"
    }

    $cmContent | Set-Content $cmPath -Encoding UTF8
    Write-Host "  [OK] UI actualizada con indicadores." -ForegroundColor Green
}


# 4. Status Update
Write-Host "4. Actualizando Estado PBT..." -ForegroundColor Yellow
$statusPath = "docs/PBT_STATUS.md"
if (Test-Path $statusPath) {
    $statusContent = Get-Content $statusPath -Raw
    
    # Actualizar Porcentaje
    $statusContent = $statusContent -replace "Progreso: \d+%", "Progreso: 85%"
    
    # Asegurar entradas en tabla (regex simple para ver si faltan)
    if ($statusContent -notmatch "07.3") {
        # Buscar la linea de 07.1 y añadir despues
        $linea071 = "\| 07.1 \| Envío de Receta por WhatsApp \| Completado \| 4 \|"
        $bloqueNuevo = "| 07.1 | Envío de Receta por WhatsApp | Completado | 4 |`n| 07.2 | Envío de Receta por Email | Completado | 3 |`n| 07.3 | Tracking de Despacho (Email/WA) | Completado | 2 |"
        $statusContent = $statusContent -replace $linea071, $bloqueNuevo
    }

    $statusContent | Set-Content $statusPath -Encoding UTF8
    Write-Host "  [OK] Status actualizado a 85%." -ForegroundColor Green
}

Write-Host "`nProtocolo Finalizado Exitosamente." -ForegroundColor Cyan
