@echo off
title Backup Otomatis SIMONCER v2 - BBPOM Semarang
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\backup-simoncer.ps1"
echo.
pause
