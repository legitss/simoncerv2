# =============================================================================
# SCRIPT DEPLOY KE WEBROOT SERVER LARAGON / APACHE (192.168.1.25)
# Lokasi: C:\laragon\www\simoncer\scripts\deploy-server.ps1
# Fungsi:
#   Menyalin hasil build produksi (dist/*) ke folder publik Apache/Laragon
#   agar langsung dapat diakses melalui https://192.168.1.25/simoncer/
#   atau VirtualHost tanpa harus membuka terminal 'npm run dev'.
# =============================================================================

param (
    [string]$TargetWebDir = "C:\laragon\www\simoncer-public"
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $ProjectDir "dist"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   DEPLOY PRODUKSI SIMONCER v2 KE SERVER LARAGON/APACHE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Pastikan sudah ter-build
if (!(Test-Path (Join-Path $DistDir "index.html"))) {
    Write-Host "Folder dist/ belum tersedia. Menjalankan build produksi terlebih dahulu..." -ForegroundColor Yellow
    Set-Location $ProjectDir
    & npm.cmd run build
}

# Backup folder target jika sudah ada isinya
if (Test-Path $TargetWebDir) {
    $BackupStamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
    $BackupWebZip = "C:\Backups\SIMONCER\webroot_backup_$BackupStamp.zip"
    if (!(Test-Path "C:\Backups\SIMONCER")) {
        New-Item -ItemType Directory -Path "C:\Backups\SIMONCER" -Force | Out-Null
    }
    Write-Host "Mem-backup folder webroot lama ke $BackupWebZip ..." -ForegroundColor Yellow
    Compress-Archive -Path "$TargetWebDir\*" -DestinationPath $BackupWebZip -Force -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Path $TargetWebDir -Force | Out-Null
}

Write-Host "Menyalin hasil build dari $DistDir ke $TargetWebDir ..." -ForegroundColor Yellow
Copy-Item -Path "$DistDir\*" -Destination $TargetWebDir -Recurse -Force

# Pastikan .htaccess tersalin untuk routing SPA Apache
$HtaccessSource = Join-Path $ProjectDir "public\.htaccess"
if (Test-Path $HtaccessSource) {
    Copy-Item -Path $HtaccessSource -Destination (Join-Path $TargetWebDir ".htaccess") -Force
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   DEPLOY KE SERVER BERHASIL!" -ForegroundColor Green
Write-Host "   Lokasi Webroot Produksi: $TargetWebDir" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
