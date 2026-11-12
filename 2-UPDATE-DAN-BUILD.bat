@echo off
title Update Otomatis SIMONCER v2 ke XAMPP - BBPOM Semarang
cd /d "%~dp0"
echo ==========================================================
echo   UPDATE OTOMATIS SIMONCER v2 DARI GITHUB KE XAMPP SERVER
echo ==========================================================

:: Pastikan folder terhubung ke GitHub
if not exist ".git" (
    git init
    git remote add origin https://github.com/legitss/simoncerv2.git
)

echo [1/3] Menarik update terbaru dari GitHub (legitss/simoncerv2)...
git fetch origin main
git reset --hard origin/main

echo [2/3] Menyalin file hasil update (dist) otomatis ke XAMPP...
if exist "C:\xampp\htdocs" (
    if not exist "C:\xampp\htdocs\simoncerv2" mkdir "C:\xampp\htdocs\simoncerv2"
    xcopy /E /I /Y "dist\*" "C:\xampp\htdocs\simoncerv2\" >nul
    xcopy /E /I /Y "dist\*" "C:\xampp\htdocs\" >nul
    echo       -> Berhasil di-update ke C:\xampp\htdocs\simoncerv2 !
)

if exist "C:\laragon\www" (
    echo       -> Folder Laragon terdeteksi, menjalankan script update penuh...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update-simoncer.ps1" -SkipGitPull
)

echo.
echo ==========================================================
echo   SUKSES! SIMONCER v2 SUDAH TER-UPDATE OTOMATIS!
echo   Silakan refresh browser: https://192.168.1.25/simoncerv2/
echo ==========================================================
pause
