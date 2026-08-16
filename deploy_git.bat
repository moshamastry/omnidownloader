@echo off
set GIT="C:\Users\Desktop\AppData\Local\GitHubDesktop\app-3.6.4\resources\app\git\cmd\git.exe"
cd /d "%~dp0"
%GIT% init
%GIT% config user.name "moshamastry"
%GIT% config user.email "newsjioonline@gmail.com"
%GIT% branch -M main
%GIT% add .
%GIT% commit -m "Deploy OmniDownloader Pro by mo.shamas"
%GIT% remote remove origin >nul 2>nul
%GIT% remote add origin https://github.com/moshamastry/omnidownloader.git
%GIT% push -u origin main --force
