@'
Write-Host ""
Write-Host "==================== AGENT START ====================" -ForegroundColor Cyan
Write-Host "REGLA: Si algo no esta demostrado por el repo/comandos, NO existe." -ForegroundColor Yellow
Write-Host "1) Lee: docs/REPO_AUDIT.md  2) No asumas nada  3) No toques codigo sin evidencia" -ForegroundColor Yellow
if (Test-Path ".\docs\REPO_AUDIT.md") {
  Write-Host "OK: docs/REPO_AUDIT.md listo." -ForegroundColor Green
} else {
  Write-Host "ERROR: No existe .\docs\REPO_AUDIT.md (repo incompleto o path incorrecto)." -ForegroundColor Red
}
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Deja la terminal lista en el repo
Set-Location $PSScriptRoot
'@ | Set-Content -Path .\agent.ps1 -Encoding UTF8
