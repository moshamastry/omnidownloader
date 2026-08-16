@echo off
setlocal
title OmniDownloader Pro - Developer Mode
cd /d "%~dp0"
color 0D

echo =======================================================
echo     OMNIDOWNLOADER PRO - LIVE DEV SERVER (HMR)
echo =======================================================
echo.

:: Kill old processes on port 4000 / 5173 to ensure fresh clean startup
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo Opening browser at http://localhost:5173...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

echo Starting live backend + frontend dev servers...
call npm.cmd run dev:web
pause
