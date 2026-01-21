# 4-auth-check.ps1
$ErrorActionPreference = "Stop"

$PROJECT = "vitalinuage"
$SERVICE = "vitalinuage-backend"
$REGION  = "us-central1"

# 1) URL Cloud Run
$BASE = (gcloud run services describe $SERVICE --region $REGION --format="value(status.url)")
$TEST_URL = "$BASE/api/patients/572/consultations"

# 2) Credenciales (email+password) + API key de Firebase Web
$email = Read-Host "Email Firebase"
$passSecure = Read-Host "Password Firebase" -AsSecureString
$passPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($passSecure))

$apiKey = Read-Host "FIREBASE_WEB_API_KEY (VITE_FIREBASE_API_KEY)"

# 3) Obtener ID token desde Identity Toolkit
$body = @{
  email = $email
  password = $passPlain
  returnSecureToken = $true
} | ConvertTo-Json

$tokenResp = Invoke-RestMethod `
  -Method POST `
  -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$apiKey" `
  -ContentType "application/json" `
  -Body $body

$idToken = $tokenResp.idToken
if (-not $idToken) { throw "No se pudo obtener idToken (revisa email/pass/apiKey)." }

Write-Host "OK: Token obtenido. Len=$($idToken.Length)"

# 4) Llamada autenticada al endpoint protegido
$headers = @{ Authorization = "Bearer $idToken" }
$r = Invoke-WebRequest -Uri $TEST_URL -Method GET -Headers $headers -UseBasicParsing -TimeoutSec 30

Write-Host "RESULT: status=$($r.StatusCode)"
if ($r.StatusCode -eq 200) { Write-Host "OK ✅ Auth OK" } else { Write-Host "FAIL ❌" }
