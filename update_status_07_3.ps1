# Script de Actualización de Status Slice 07.3
# Ejecutar: ./update_status_07_3.ps1

$statusPath = "docs/PBT_STATUS.md"
if (Test-Path $statusPath) {
    $content = Get-Content $statusPath -Raw
    # Update progress roughly looking for pattern
    $content = $content -replace "Progreso Global: \d+%", "Progreso Global: 85%"
    
    # Add log if possible (simple append)
    $logEntry = "`n- **Slice 07.3 (Dispatch Tracking)**: Implementado tracking de envíos (WhatsApp/Email) y actualización de UI. [Automated Update]"
    $content += $logEntry
    
    $content | Set-Content $statusPath -Encoding UTF8
    Write-Host "Status updated to 85%." -ForegroundColor Green
}
else {
    Write-Host "Status file not found." -ForegroundColor Red
}
