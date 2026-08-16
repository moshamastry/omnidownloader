@echo off
setlocal
cd /d "%~dp0"
color 0A

echo =======================================================
echo    CREATING OMNIDOWNLOADER DESKTOP SHORTCUT
echo =======================================================
echo.

set "TARGET_DIR=%~dp0"
set "TARGET_FILE=%TARGET_DIR%START_DOWNLOADER.bat"

(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sDesktop = oWS.SpecialFolders^("Desktop"^)
echo sLinkFile = sDesktop ^& "\Omni Downloader.lnk"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "%TARGET_FILE%"
echo oLink.WorkingDirectory = "%TARGET_DIR%"
echo oLink.Description = "OmniDownloader Pro - 1-Click Launch"
echo oLink.WindowStyle = 1
echo oLink.Save
echo WScript.Echo "[SUCCESS] Desktop Shortcut created at: " ^& sLinkFile
) > "%TEMP%\CreateShortcut.vbs"

cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

echo.
echo You can now launch OmniDownloader directly from your Desktop anytime!
echo.
