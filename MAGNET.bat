@echo off
color 0B
echo ===================================================
echo   QANTUM-JULES: THE MAGNET PROTOCOL
echo   PHASE 3: SCAVENGER A.I.
echo ===================================================
echo [SYSTEM] Teleporting to Safe Sector...
cd /d "%~dp0LwaS\lwas_cli"

echo [SYSTEM] Igniting Magnet Core...
echo.
echo [INSTRUCTION] 
echo When ASH starts, type:
echo magnet
echo.
echo This will scan your Desktop for scattered modules.
echo ===================================================
cargo run -- --sovereign
pause
