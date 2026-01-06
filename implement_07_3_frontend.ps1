# Script de Implementación Slice 07.3 - Frontend
# Ejecutar desde la raíz del proyecto: ./implement_07_3_frontend.ps1

Write-Host "Iniciando implementación Slice 07.3 - Frontend..." -ForegroundColor Cyan

# 1. Actualizar Contratos
Write-Host "1. Actualizando types en contracts/consultations.ts..." -ForegroundColor Yellow
$contractsPath = "frontend/src/contracts/consultations.ts"
$contractsContent = Get-Content $contractsPath -Raw

if ($contractsContent -notmatch "email_sent_at") {
    $contractsContent = $contractsContent -replace "updated_at\?: string;", "updated_at?: string;`n    email_sent_at?: string;`n    whatsapp_sent_at?: string;"
    $contractsContent | Set-Content $contractsPath -Encoding UTF8
}

# 2. Actualizar ConsultationManager.tsx
Write-Host "2. Actualizando ConsultationManager.tsx..." -ForegroundColor Yellow
$cmPath = "frontend/src/components/ConsultationManager.tsx"
$cmContent = Get-Content $cmPath -Raw

# 2.1 Importar Check icon
if ($cmContent -notmatch "Check") {
    # Agregamos Check a los imports de lucide-react. Buscamos 'Mail' que agregamos antes
    $cmContent = $cmContent -replace "Mail", "Mail, Check"
}

# 2.2 Actualizar handleSendWhatsApp para tracking y update local
# USE @' to prevent variable expansion
$waLogicFixed = @'
            window.open(whatsappUrl, '_blank');

            // Tracking
            fetch(`${apiUrl}/api/consultas/${consultation.id}/mark-whatsapp-sent`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(console.error);
            
            setHistory(prev => prev.map(item => 
                item.id === consultation.id 
                ? { ...item, whatsapp_sent_at: new Date().toISOString() } 
                : item
            ));
'@

# Usamos -replace simples
$cmContent = $cmContent.Replace("window.open(whatsappUrl, '_blank');", $waLogicFixed)


# 2.3 Actualizar handleSendEmail para update local
# Buscamos 'toast.success(`Email enviado a ${consultation.patient.email}`);'
$emailUpdate = @'
                toast.success(`Email enviado a ${consultation.patient.email}`);
                setHistory(prev => prev.map(item => 
                    item.id === consultation.id 
                    ? { ...item, email_sent_at: new Date().toISOString() } 
                    : item
                ));
'@
$cmContent = $cmContent.Replace('toast.success(`Email enviado a ${consultation.patient.email}`);', $emailUpdate)


# 2.4 Actualizar UI Buttons para mostrar Check/Badge
# Whatsapp Button
$cmContent = $cmContent -replace "WhatsApp`n", "{c.whatsapp_sent_at && <Check className='w-3 h-3' />} WhatsApp`n"

# Email Button
$cmContent = $cmContent -replace "Email`n", "{c.email_sent_at && <Check className='w-3 h-3' />} Email`n"


$cmContent | Set-Content $cmPath -Encoding UTF8

Write-Host "Frontend Implementation Complete." -ForegroundColor Green
