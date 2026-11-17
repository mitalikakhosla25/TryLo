# TryLo PowerShell Services Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching TryLo Development Environment" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$pythonExe = Join-Path $backendDir ".venv\Scripts\python.exe"

Write-Host "`n[1/2] Starting Backend API (http://127.0.0.1:8000)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"cd /d `"$backendDir`" && `"$pythonExe`" -m uvicorn app.main:app --host 127.0.0.1 --port 8000`""

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Frontend UI (http://localhost:5173)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"cd /d `"$frontendDir`" && npm run dev`""

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  Both services are running!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173/" -ForegroundColor White
Write-Host "  Backend:  http://127.0.0.1:8000/" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Green
