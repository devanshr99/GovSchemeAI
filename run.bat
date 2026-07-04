@echo off
title YojanaAI Launcher
echo Starting YojanaAI Government Schemes Platform...
echo ===================================================

:: Check if port 8000 is busy
netstat -ano | findstr :8000 > nul
if %errorlevel% equ 0 (
    echo [INFO] Backend port 8000 is already active. Assuming backend is running.
) else (
    echo Starting Backend Server (FastAPI on http://127.0.0.1:8000)...
    cd backend
    start "YojanaAI Backend" cmd /k ".venv\Scripts\python -m uvicorn app.main:app --port 8000"
    cd ..
    timeout /t 3 /nobreak > nul
)

:: Check if port 3000 is busy
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo [INFO] Frontend port 3000 is already active. Assuming frontend is running.
) else (
    echo Starting Frontend Server (Next.js on http://localhost:3000)...
    cd frontend
    start "YojanaAI Frontend" cmd /c "npm run dev"
    cd ..
    timeout /t 2 /nobreak > nul
)

:: Open Admin Panel and Website in Browser
echo Opening browser...
start http://localhost:3000/admin
start http://localhost:3000

echo ===================================================
echo YojanaAI is running!
echo Backend is at http://127.0.0.1:8000
echo Frontend is at http://localhost:3000
echo ===================================================
echo Press any key to exit this launcher window...
pause > nul
