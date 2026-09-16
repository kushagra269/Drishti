param(
  [switch]$WithKafka
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Starting ANPR backend (keeps running)..." -ForegroundColor Cyan
$backendArgs = @("-ExecutionPolicy", "Bypass", "-File", "$root\backend\scripts\run_platform.ps1", "-KeepAlive")
if ($WithKafka) { $backendArgs += "-WithKafka" }

Start-Process -FilePath "powershell" -ArgumentList $backendArgs -WorkingDirectory "$root\backend" -WindowStyle Minimized

Write-Host "Waiting for backend health on :8080..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
  try {
    $res = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/health" -UseBasicParsing -TimeoutSec 2
    if ($res.StatusCode -eq 200) {
      $ready = $true
      break
    }
  } catch {
    Start-Sleep -Seconds 2
  }
}

if (-not $ready) {
  Write-Host "Backend not healthy yet — frontend will still start; camera feed retries automatically." -ForegroundColor Yellow
} else {
  Write-Host "Backend is healthy." -ForegroundColor Green
}

Write-Host "Starting NETRA frontend..." -ForegroundColor Cyan
Set-Location "$root\frontend"
npm run dev
