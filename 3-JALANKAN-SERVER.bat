@echo off
title Server SIMONCER v2 (Port 3000) - BBPOM Semarang
cd /d "%~dp0"
echo ==========================================================
echo   MENJALANKAN SERVER SIMONCER v2 DI PORT 3000 (PRODUCTION)
echo   Akses Lokal : http://localhost:3000
echo ==========================================================
if exist "dist\index.html" (
    set NODE_ENV=production
)
call npm.cmd run dev
pause
