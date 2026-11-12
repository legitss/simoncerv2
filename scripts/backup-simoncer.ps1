# =============================================================================
# SCRIPT BACKUP OTOMATIS SIMONCER v2 (BBPOM SEMARANG)
# Lokasi: C:\laragon\www\simoncer\scripts\backup-simoncer.ps1
# Fungsi: Membuat arsip ZIP aplikasi (source code + .env + dist) tanpa node_modules
# =============================================================================

param (
    [string]$BackupRoot = "C:\Backups\SIMONCER",
    [int]$KeepLatest = 10
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$ZipFileName = "simoncerv2_backup_$Timestamp.zip"
$DestinationZip = Join-Path $BackupRoot $ZipFileName
$TempStageDir = Join-Path $env:TEMP "simoncer_backup_stage_$Timestamp"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   BACKUP OTOMATIS SIMONCER v2 - BBPOM DI SEMARANG" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Folder Proyek : $ProjectDir"
Write-Host "Tujuan Backup : $DestinationZip"

# 1. Buat direktori backup jika belum ada
if (!(Test-Path $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
}

# 2. Salin file proyek ke folder staging sementara (kecuali node_modules & .git)
Write-Host "`n[1/3] Menyiapkan berkas proyek (mengecualikan node_modules agar ukuran ringan)..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $TempStageDir -Force | Out-Null

$ExcludeDirs = @("node_modules", ".git", ".vite")
Get-ChildItem -Path $ProjectDir -Force | Where-Object {
    $ExcludeDirs -notcontains $_.Name
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $TempStageDir -Recurse -Force
}

# 3. Kompres ke dalam format .zip
Write-Host "[2/3] Mengompres berkas ke arsip ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$TempStageDir\*" -DestinationPath $DestinationZip -CompressionLevel Optimal -Force

# Bersihkan folder staging sementara
Remove-Item -Path $TempStageDir -Recurse -Force -ErrorAction SilentlyContinue

$ZipInfo = Get-Item $DestinationZip
$SizeMB = [math]::Round($ZipInfo.Length / 1MB, 2)
Write-Host "[3/3] Backup selesai dibuat! Ukuran: $SizeMB MB" -ForegroundColor Green

# 4. Rotasi Backup: Hapus backup lama jika melebihi batas $KeepLatest
$AllBackups = Get-ChildItem -Path $BackupRoot -Filter "simoncerv2_backup_*.zip" | Sort-Object LastWriteTime -Descending
if ($AllBackups.Count -gt $KeepLatest) {
    $OldBackups = $AllBackups | Select-Object -Skip $KeepLatest
    foreach ($old in $OldBackups) {
        Write-Host "Menghapus backup lama: $($old.Name)" -ForegroundColor DarkGray
        Remove-Item $old.FullName -Force
    }
}

Write-Host "`nSUKSES: File backup tersimpan di:" -ForegroundColor Green
Write-Host "-> $DestinationZip" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
