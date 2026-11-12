# =============================================================================
# SCRIPT UPDATE & BUILD PRODUKSI SIMONCER v2 (BBPOM SEMARANG)
# Lokasi: C:\laragon\www\simoncer\scripts\update-simoncer.ps1
# Fungsi:
#   1. Backup otomatis kondisi aplikasi saat ini sebelum update
#   2. Pull update terbaru dari Git (opsional jika terhubung ke GitHub)
#   3. Install/update paket npm (--legacy-peer-deps) & pastikan react-is ada
#   4. Build produksi (npm.cmd run build) ke folder dist/
# =============================================================================

param (
    [switch]$SkipGitPull = $false,
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   UPDATE & BUILD PRODUKSI SIMONCER v2 - BBPOM SEMARANG" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Backup Otomatis Sebelum Update
if (-not $SkipBackup) {
    Write-Host "`n[Langkah 1/4] Membuat backup keamanan sebelum update..." -ForegroundColor Yellow
    & "$PSScriptRoot\backup-simoncer.ps1"
} else {
    Write-Host "`n[Langkah 1/4] Melewati backup otomatis (-SkipBackup aktif)..." -ForegroundColor DarkGray
}

# 2. Git Pull (jika folder memiliki repositori .git dan tidak di-skip)
if ((-not $SkipGitPull) -and (Test-Path (Join-Path $ProjectDir ".git"))) {
    Write-Host "`n[Langkah 2/4] Menarik pembaruan kode dari Git repository..." -ForegroundColor Yellow
    try {
        git status -s
        git pull
    } catch {
        Write-Host "Peringatan: 'git pull' dilewati atau memiliki perubahan lokal. Melanjutkan dengan file lokal..." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "`n[Langkah 2/4] Menggunakan source code lokal saat ini..." -ForegroundColor Yellow
}

# 3. Install Dependencies
Write-Host "`n[Langkah 3/4] Memeriksa & menginstal dependensi NPM..." -ForegroundColor Yellow
& npm.cmd install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    throw "Gagal menjalankan npm.cmd install --legacy-peer-deps"
}

# 4. Build Production (dist/)
Write-Host "`n[Langkah 4/4] Mem-build aplikasi produksi (folder dist/)..." -ForegroundColor Yellow
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    throw "Gagal menjalankan npm.cmd run build"
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   UPDATE & BUILD SELESAI DENGAN SUKSES!" -ForegroundColor Green
Write-Host "   Folder siap pakai produksi: $ProjectDir\dist" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
