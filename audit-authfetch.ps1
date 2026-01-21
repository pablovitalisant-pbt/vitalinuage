# audit-authfetch.ps1
$ErrorActionPreference = "Stop"

$PROJECT = "vitalinuage"
$SERVICE = "vitalinuage-backend"
$REGION  = "us-central1"
$FRESH   = "60m"

Write-Host ""
Write-Host "===================="
Write-Host "0) Sanity: gcloud + proyecto activo"
Write-Host "===================="
gcloud config set project $PROJECT | Out-Null
gcloud auth list

Write-Host ""
Write-Host "===================="
Write-Host "1) Cloud Run logs: detectar 'Bearer null' (debe ser 0)"
Write-Host "===================="
$FILTER1 = @"
resource.type="cloud_run_revision"
resource.labels.service_name="$SERVICE"
(
  (Bearer AND null)
  OR (Raw AND Authorization AND header AND Bearer AND null)
  OR (token AND null AND empty)
)
"@
$hits = (gcloud logging read $FILTER1 --freshness=$FRESH --limit=200 --format="value(timestamp)" | Measure-Object).Count
if ($hits -eq 0) { Write-Host "OK: 0 matches ✅" } else { Write-Host "FAIL: $hits matches ❌" }

Write-Host ""
Write-Host "===================="
Write-Host "2) Últimas 20 requests a /consultations (status)"
Write-Host "===================="
$FILTER2 = @"
resource.type="cloud_run_revision"
resource.labels.service_name="$SERVICE"
httpRequest.requestUrl:"/api/patients/"
httpRequest.requestUrl:"/consultations"
"@
gcloud logging read $FILTER2 --freshness=$FRESH --limit=20 --format="table(timestamp,httpRequest.status,httpRequest.requestMethod,httpRequest.requestUrl)"

Write-Host ""
Write-Host "===================="
Write-Host "3) API check SIN Authorization (esperado: 401)"
Write-Host "===================="
$BASE = (gcloud run services describe $SERVICE --region $REGION --format="value(status.url)")
$TEST_URL = "$BASE/api/patients/572/consultations"
try {
  $r = Invoke-WebRequest -Uri $TEST_URL -Method GET -UseBasicParsing -TimeoutSec 30
  Write-Host "FAIL: status=$($r.StatusCode) (esperado 401) ❌"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 401) { Write-Host "OK: status=401 ✅" } else { Write-Host "FAIL: status=$code (esperado 401) ❌" }
}

Write-Host ""
Write-Host "===================="
Write-Host "4) API check CON Authorization (esperado: 200) - requiere FIREBASE_ID_TOKEN"
Write-Host "===================="
if (-not $env:FIREBASE_ID_TOKEN -or $env:FIREBASE_ID_TOKEN.Trim() -eq "") {
  Write-Host "SKIP: define FIREBASE_ID_TOKEN en env para correr esta prueba."
  Write-Host 'Ej: $env:FIREBASE_ID_TOKEN = "eyJhbGciOi..."'
} else {
  try {
    $headers = @{ Authorization = "Bearer $($env:FIREBASE_ID_TOKEN)" }
    $r2 = Invoke-WebRequest -Uri $TEST_URL -Method GET -Headers $headers -UseBasicParsing -TimeoutSec 30
    if ($r2.StatusCode -eq 200) { Write-Host "OK: status=200 ✅" } else { Write-Host "FAIL: status=$($r2.StatusCode) (esperado 200) ❌" }
  } catch {
    $code2 = $_.Exception.Response.StatusCode.value__
    Write-Host "FAIL: status=$code2 (esperado 200) ❌"
  }
}

Write-Host ""
Write-Host "===================="
Write-Host "5) Repo grep: cero localStorage token"
Write-Host "===================="
$matchesToken = Get-ChildItem -Recurse -File .\frontend\src | Select-String -SimpleMatch "localStorage.getItem('token')" -List
if ($matchesToken) { Write-Host "FAIL: hay uso de localStorage token ❌"; $matchesToken } else { Write-Host "OK: 0 usos ✅" }

Write-Host ""
Write-Host "===================="
Write-Host "6) Repo grep: fetch() directos (excluye authFetch.ts) - debe ser 0 o solo públicos"
Write-Host "===================="
$fetchHits = Get-ChildItem -Recurse -File .\frontend\src |
  Where-Object { $_.FullName -notmatch "authFetch\.ts$" } |
  Select-String -Pattern "\bfetch\(" -List

if ($fetchHits) {
  Write-Host "WARN: hay fetch() directos (revisar si son PUBLICOS o legacy) ⚠️"
  $fetchHits | ForEach-Object { $_.Path + ":" + $_.LineNumber + ": " + $_.Line.Trim() }
} else {
  Write-Host "OK: 0 fetch() directos ✅"
}

Write-Host ""
Write-Host "DONE ✅"
