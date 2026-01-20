# audit-env.ps1
# Checks for presence of Firebase environment variables in .env.local

$RequiredVars = @(
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID"
)

$EnvFile = ".\.env.local"

if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ .env.local file NOT found." -ForegroundColor Red
    Write-Host "   Please create it using .env.example as a template." -ForegroundColor Gray
    exit 1
}

$Content = Get-Content $EnvFile
$Missing = @()

foreach ($Var in $RequiredVars) {
    if (-not ($Content -match "^$Var=")) {
        $Missing += $Var
    }
}

if ($Missing.Count -gt 0) {
    Write-Host "❌ Missing variables in .env.local:" -ForegroundColor Red
    $Missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    exit 1
} else {
    Write-Host "✅ All required Firebase variables found in .env.local" -ForegroundColor Green
    exit 0
}
