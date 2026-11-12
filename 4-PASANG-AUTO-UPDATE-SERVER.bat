@echo off
title Pasang Auto-Update Otomatis Server SIMONCER v2 (Setiap 30 Menit)
cd /d "%~dp0"
echo =====================================================================
echo   MEMASANG JADWAL AUTO-UPDATE OTOMATIS SIMONCER v2 DARI GITHUB
echo   Server akan otomatis mengecek update GitHub setiap 30 menit
echo   sehingga Anda cukup Push dari rumah/laptop tanpa perlu buka server!
echo =====================================================================

:: Buat script background silent update
set "SILENT_SCRIPT=%~dp0scripts\auto-sync-xampp.bat"
(
echo @echo off
echo cd /d "%~dp0"
echo git fetch origin main
echo git reset --hard origin/main
echo if exist "C:\xampp\htdocs" ^(
echo     if not exist "C:\xampp\htdocs\simoncerv2" mkdir "C:\xampp\htdocs\simoncerv2"
echo     xcopy /E /I /Y "dist\*" "C:\xampp\htdocs\simoncerv2\" ^>nul
echo     xcopy /E /I /Y "dist\*" "C:\xampp\htdocs\" ^>nul
echo ^)
) > "%SILENT_SCRIPT%"

:: Daftarkan ke Windows Task Scheduler (jalan otomatis tiap 30 menit)
schtasks /Create /SC MINUTE /MO 30 /TN "SIMONCER_AutoUpdate_GitHub" /TR "\"%SILENT_SCRIPT%\"" /F

echo.
echo =====================================================================
echo   SUKSES! Server sekarang akan otomatis tarik update dari GitHub
echo   ke C:\xampp\htdocs\simoncerv2 setiap 30 menit!
echo   (Anda bisa update dari rumah cukup dengan commit dan push ke GitHub)
echo =====================================================================
pause
