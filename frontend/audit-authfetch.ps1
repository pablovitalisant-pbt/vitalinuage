
# audit-authfetch.ps1
# Auditoría de cumplimiento para AuthFetch Architecture

Write-Host "Iniciando auditoría de AuthFetch..." -ForegroundColor Cyan

# 1. Verificar prohibición de localStorage.getItem('token')
Write-Host "1. Buscando uso prohibido de localStorage('token')..."
$violations = Get-ChildItem -Recurse -File .\src | Select-String -Pattern "localStorage\.getItem" 
$tokenViolations = @()

if ($violations) {
    foreach ($v in $violations) {
        if ($v.Line -match "'token'" -or $v.Line -match '"token"') {
            $tokenViolations += $v
        }
    }
}

if ($tokenViolations.Count -gt 0) {
    Write-Host "FALLO: Se encontraron accesos directos al token en localStorage:" -ForegroundColor Red
    $tokenViolations | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow }
}
else {
    Write-Host "OK: No hay uso de localStorage('token')." -ForegroundColor Green
}

# 2. Verificar uso de fetch() directo (Excluyendo permitidos)
Write-Host "2. Buscando uso de fetch() directos no permitidos..."

# Archivos permitidos/excluidos explícitamente
$AllowedFiles = @(
    "authFetch.ts",       
    "Public",             
    "VerifyEmail",        
    "delivery.service",   
    "TalonarioCalibrator", 
    "PrescriptionMapEditor" 
)

# Buscar todos los fetch
$AllFetches = Get-ChildItem -Recurse -File .\src | Where-Object { $_.FullName -notmatch "node_modules" } | Select-String -Pattern "\bfetch\("

$PrivilegedViolations = @()
$AllowedCount = 0

foreach ($match in $AllFetches) {
    $isAllowed = $false
    foreach ($allow in $AllowedFiles) {
        if ($match.Path -match $allow) {
            $isAllowed = $true
            break
        }
    }

    if (-not $isAllowed) {
        $PrivilegedViolations += $match
    }
    else {
        $AllowedCount++
    }
}

if ($PrivilegedViolations.Count -gt 0) {
    Write-Host "FALLO: Se encontraron $($PrivilegedViolations.Count) fetch() privados directos:" -ForegroundColor Red
    $PrivilegedViolations | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber) -> $($_.Line.Trim())" -ForegroundColor Yellow }
    Write-Host "   (Estos deben migrarse a useAuthFetch)" -ForegroundColor Gray
}
else {
    Write-Host "OK: 0 fetch privados detectados." -ForegroundColor Green
    Write-Host "Info: $AllowedCount fetch() públicos/permitidos detectados (dev-only o legacy)." -ForegroundColor Gray
}

# 3. Verificar DoctorContext profile sync (debe usar authFetch/service)
Write-Host "3. Verificando DoctorContext..."
$DoctorContextPath = ".\src\context\DoctorContext.tsx"
if (Test-Path $DoctorContextPath) {
    $DoctorContext = Get-Content $DoctorContextPath -Raw
    if ($DoctorContext -match "fetch\(") {
        # Ya lo atrapa el punto 2, pero doble check específico
        if ($DoctorContext -notmatch "createAuthFetch") {
            Write-Host "WARN: DoctorContext parece tener fetch pero no usa createAuthFetch." -ForegroundColor Yellow
        }
    }
}

Write-Host "Auditoría finalizada." -ForegroundColor Cyan
