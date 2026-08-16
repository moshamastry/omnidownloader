@echo off
setlocal enabledelayedexpansion
title OmniDownloader Pro
cd /d "%~dp0"
color 0A

echo =======================================================
echo             OMNIDOWNLOADER PRO - LAUNCHER
echo =======================================================
echo.

:: Check node
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Kill old processes on port 4000 / 5173 to ensure fresh clean startup
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo [1/3] Checking build files...
if not exist "backend\dist\server.js" (
    echo [INFO] Compiling backend and frontend...
    call npm.cmd run build
)
if not exist "frontend\dist\index.html" (
    echo [INFO] Compiling frontend...
    call npm.cmd run build
)

echo.
echo [2/3] Opening Downloader in your default browser...
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:4000"

echo [3/3] Starting OmniDownloader Server...
echo.
echo =======================================================
echo   * Web UI:    http://localhost:4000
echo   * WebSocket: ws://localhost:4000/ws
echo   * Status:    RUNNING & READY
echo.
echo   NOTE: Keep this window open while using Downloader!
echo   To stop Downloader, simply close this window.
echo =======================================================
echo.

:: Start server in foreground (keeps window open cleanly)
call node backend\dist\server.js

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Server exited with code %errorlevel%.
    pause
)
