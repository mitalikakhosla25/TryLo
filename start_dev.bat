@echo off
title TryLo Services Launcher
echo ========================================================
echo   Launching TryLo Development Environment
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend API (http://127.0.0.1:8000)...
start "TryLo Backend API" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend UI (http://localhost:5173)...
start "TryLo Frontend UI" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo   Both services are running!
echo   Frontend URL: http://localhost:5173/
echo   Backend URL:  http://127.0.0.1:8000/
echo ========================================================
echo.
pause

