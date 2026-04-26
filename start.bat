@echo off
echo ================================================
echo   Medical Document Intelligence System
echo   Starting all services...
echo ================================================
echo.

REM Check if Ollama is installed
where ollama >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ollama is not installed or not in PATH
    echo Please install from: https://ollama.ai
    pause
    exit /b 1
)

REM Start Ollama (if not already running)
echo [1/3] Starting Ollama service...
start "Ollama" cmd /c "ollama serve"
timeout /t 3 /nobreak >nul

REM Start Backend
echo [2/3] Starting Backend API...
start "Backend API" cmd /c "cd /d %~dp0backend && npm run dev"
timeout /t 2 /nobreak >nul

REM Start Frontend
echo [3/3] Starting Frontend...
start "Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo ================================================
echo   All services starting up!
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo.
echo   Open your browser to: http://localhost:3000
echo ================================================
echo.
pause
