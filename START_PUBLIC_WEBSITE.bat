@echo off
setlocal enabledelayedexpansion
title OmniDownloader Pro - Live Public Website Launcher
color 0b

echo =======================================================
echo   OMNIDOWNLOADER PRO - LIVE PUBLIC INTERNET LAUNCHER
echo =======================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking and freeing port 4000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Checking production build...
if not exist "backend\dist\server.js" (
    call npm.cmd run build:backend
)
if not exist "frontend\dist\index.html" (
    call npm.cmd run build:frontend
)

echo [3/3] Starting backend server on Port 4000...
start /b "" node backend/dist/server.js

timeout /t 2 /nobreak >nul

echo.
echo =======================================================
echo   CHOOSE YOUR PUBLIC WEBSITE METHOD:
echo =======================================================
echo   [1] Cloudflare Global Fast Tunnel (No Bad Gateway, Fastest, 100%% Stable)
echo   [2] Branded Subdomain (https://omnidownloader-pro.loca.lt)
echo =======================================================
echo.

set /p choice="Enter choice [1 or 2, default is 1]: "
if "%choice%"=="" set choice=1

if "%choice%"=="2" (
    echo.
    echo Starting Branded Localtunnel: https://omnidownloader-pro.loca.lt
    echo (Localtunnel password if asked: )
    curl.exe -s https://loca.lt/mytunnelpassword
    echo.
    call npx.cmd -y localtunnel --port 4000 --local-host 127.0.0.1 --subdomain omnidownloader-pro
) else (
    echo.
    echo Starting Cloudflare Enterprise High-Speed Tunnel...
    if exist "tools\cloudflared.exe" (
        tools\cloudflared.exe tunnel --url http://127.0.0.1:4000
    ) else (
        call npx.cmd -y localtunnel --port 4000 --local-host 127.0.0.1 --subdomain omnidownloader-pro
    )
)

pause
