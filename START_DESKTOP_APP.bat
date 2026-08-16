@echo off
setlocal
title OmniDownloader Pro - Desktop App
cd /d "%~dp0"
color 0B

echo =======================================================
echo        OMNIDOWNLOADER PRO - DESKTOP APP
echo =======================================================
echo.

:: Check node
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found in your system PATH!
    pause
    exit /b 1
)

:: Check build
if not exist "electron\dist\main.js" (
    echo [INFO] Compiling Electron desktop app...
    call npm.cmd run build
)

:: Kill any hanging process on Port 4000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo Launching Desktop Window...
call npx.cmd electron electron

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Desktop app exited with code %errorlevel%.
    pause
)
