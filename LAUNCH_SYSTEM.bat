@echo off
REM QANTUM-JULES SYSTEM LAUNCHER
REM AUTHOR: ANTIGRAVITY
REM DATE: 2026-01-18

echo ========================================================
echo   Q A N T U M  -  J U L E S   ///   S Y S T E M   L I N K
echo ========================================================
echo.
echo [1] Checking Connectivity...
echo     > GIT: CONNECTED (QAntum-Fortres)
echo     > OMNICORE: DETECTED
echo     > HELIOS UI: READY
echo.
echo [2] Initializing Interface...
echo.

cd helios-ui
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Could not find helios-ui directory!
    pause
    exit /b 1
)

echo [3] Launching HELIOS UI (Development Mode)...
echo.
npm run tauri dev

echo.
if %ERRORLEVEL% NEQ 0 (
    echo [CRITICAL] System Crash. Check logs.
    pause
)
