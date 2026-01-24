@echo off
title QAntum Singularity - Launch Sequence
echo 🌌 INITIATING SINGULARITY CORE...
echo.

:: Start OmniCore Backend
:: Start Sovereign Monolith (Tauri + Rust Axum)
start "SovereignMonolith" /D "%~dp0helios-ui" cmd /c "npm run tauri dev"

echo.
echo ✅ ALL SYSTEMS PULSING.
echo 💎 SOVEREIGN HUD ACTIVE.
pause
