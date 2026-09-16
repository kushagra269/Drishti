# Restarts the ANPR platform if it exits so the camera feed stays alive.
$ErrorActionPreference = "Continue"
& "$PSScriptRoot\run_platform.ps1" -KeepAlive
