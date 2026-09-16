param(
  [switch]$WithKafka,
  [switch]$KeepAlive
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

function Resolve-AnprPython {
  $venvPy = Join-Path (Get-Location) ".venv\Scripts\python.exe"
  if (Test-Path $venvPy) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $venvPy -c "import fastapi" 1>$null 2>$null
    $ok = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $prev
    if ($ok) { return $venvPy }
  }
  $cmd = Get-Command python -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  throw "No Python with ANPR dependencies found. Install requirements.txt into .venv first."
}

if ($WithKafka) {
  docker compose up -d kafka
  Start-Sleep -Seconds 8
}

$python = Resolve-AnprPython
Write-Host "Using Python: $python" -ForegroundColor Cyan
$env:PYTHONPATH = (Resolve-Path .\src).Path
$env:OMP_NUM_THREADS = "1"
$env:KMP_DUPLICATE_LIB_OK = "TRUE"

if ($KeepAlive) {
  while ($true) {
    Write-Host "$(Get-Date -Format o) | starting anpr platform..." -ForegroundColor Green
    & $python -m anpr
    Write-Host "$(Get-Date -Format o) | anpr exited ($LASTEXITCODE) - restarting in 3s" -ForegroundColor Yellow
    Start-Sleep -Seconds 3
  }
} else {
  & $python -m anpr
}
