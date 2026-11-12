# 📘 PANDUAN LENGKAP PINDAH KE SERVER (`192.168.1.25`), UPDATE, DAN BACKUP — SIMONCER v2

Dokumen ini berisi panduan langkah demi langkah serta daftar *script* otomatis satu-klik untuk memindahkan aplikasi **SIMONCER v2** dari komputer lokal ke **Komputer Server (`192.168.1.25`)**, melakukan **Update**, serta melakukan **Backup & Restore**.

---

## 🛠️ Daftar Script Otomatis (Tinggal Klik 2x di Windows)

Di dalam folder utama `C:\laragon\www\simoncer`, telah disiapkan 3 file `.bat` yang otomatis melewati *PowerShell Execution Policy* Windows:

| Nama File Script | Fungsi Utama |
| :--- | :--- |
| **`1-BACKUP-SIMONCER.bat`** | Membuat file `.zip` cadangan (*backup*) seluruh kode + `.env` + hasil build `dist/` ke `C:\Backups\SIMONCER\simoncerv2_backup_YYYY-MM-DD_HHmmss.zip` (tanpa `node_modules` agar ukuran file kecil ~2–5 MB dan mudah dicopy ke Flashdisk/Server). Otomatis menyimpan 10 backup terakhir. |
| **`2-UPDATE-DAN-BUILD.bat`** | Melakukan **Auto-Backup** terlebih dahulu, menarik update terbaru (`git pull`), menginstal paket NPM (`npm.cmd install --legacy-peer-deps`), dan mem-build ulang folder produksi `dist/` (`npm.cmd run build`). |
| **`3-JALANKAN-SERVER.bat`** | Menjalankan server SIMONCER v2 pada port `3000` (`http://localhost:3000` atau `http://192.168.1.25:3000`). |

*(Seluruh logika PowerShell berada di dalam folder `scripts\backup-simoncer.ps1`, `scripts\update-simoncer.ps1`, dan `scripts\deploy-server.ps1`).*

---

## 🚀 BAGIAN 1: Cara Memindahkan SIMONCER v2 ke Komputer Server (`192.168.1.25`)

Terdapat **2 Metode** untuk memasang di komputer server `192.168.1.25`. Anda bisa memilih salah satu yang paling sesuai dengan konfigurasi server saat ini:

### Opsi A — Langsung Pakai Hasil Build (`dist/`) di Apache / Laragon Server (Paling Ringan & Tanpa Perlu `npm run dev`)
Karena SIMONCER v2 menghasilkan bundel statis siap pakai di dalam folder **`dist/`** (sudah dilengkapi file `.htaccess`), server Apache/Laragon dapat langsung menayangkannya di `https://192.168.1.25/simoncer/`:

1. **Di Komputer Lokal (Saat Ini):**
   - Klik 2x **`2-UPDATE-DAN-BUILD.bat`** untuk memastikan folder `C:\laragon\www\simoncer\dist` berisi versi terbaru.
2. **Di Komputer Server (`192.168.1.25`):**
   - **Backup dulu folder lama di server:** Masuk ke `C:\laragon\www\` di server, lalu *rename* folder `simoncer` lama menjadi `simoncer_lama_backup` (atau zip folder tersebut).
   - Buat folder baru `C:\laragon\www\simoncer` di server.
   - Salin **seluruh isi** dari folder `C:\laragon\www\simoncer\dist\*` (dari komputer lokal) ke dalam `C:\laragon\www\simoncer\` (di komputer server).
   - *(Catatan penting jika diakses melalui subfolder `https://192.168.1.25/simoncer/`)*:
     Jika di server diakses lewat subfolder `/simoncer/`, ubah pengaturan `base: '/'` di `vite.config.ts` atau jalankan build dengan:
     ```powershell
     npx.cmd vite build --base=/simoncer/
     ```
     lalu salin isi `dist/` ke `C:\laragon\www\simoncer\` di server.

---

### Opsi B — Pindahkan Seluruh Proyek ke Server (Bisa Edit/Update Langsung di Server)

1. **Di Komputer Lokal:**
   - Klik 2x file **`1-BACKUP-SIMONCER.bat`**.
   - Buka folder `C:\Backups\SIMONCER\` dan ambil file ZIP terbaru (`simoncerv2_backup_....zip`).
2. **Pindahkan ke Komputer Server (`192.168.1.25`):**
   - Salin file ZIP tersebut ke komputer server menggunakan Flashdisk / Share Folder LAN (`\\192.168.1.25\...`).
   - Ekstrak isi ZIP ke `C:\laragon\www\simoncerv2` (atau `C:\laragon\www\simoncer`).
3. **Instalasi Awal di Komputer Server (Cukup 1 Kali Saja):**
   - Buka terminal **PowerShell / CMD** di dalam folder `C:\laragon\www\simoncer` di server, lalu jalankan:
     ```powershell
     npm.cmd install --legacy-peer-deps
     npm.cmd run build
     ```
4. **Menjalankan di Server:**
   - Klik 2x **`3-JALANKAN-SERVER.bat`**, atau jika ingin berjalan otomatis di latar belakang menggunakan **PM2**:
     ```powershell
     npm.cmd install -g pm2
     pm2 start npm.cmd --name "simoncer-v2" -- run dev
     pm2 save
     ```

---

## 🔄 BAGIAN 2: Cara Update Aplikasi di Server Saat Ada Perubahan

Setiap kali ada perbaikan tampilan atau fitur baru:

### Cara 1: Menggunakan Script Satu-Klik (Rekomendasi)
1. Jika Anda menyalin file kode baru (`src/...`) ke komputer server, cukup klik 2x file:
   👉 **`2-UPDATE-DAN-BUILD.bat`**
2. Script tersebut akan secara otomatis:
   - Membuat **Backup ZIP** versi sebelum di-update ke `C:\Backups\SIMONCER\`.
   - Menjalankan `git pull` (jika menggunakan Git).
   - Menjalankan `npm.cmd install --legacy-peer-deps`.
   - Mem-build ulang folder produksi `dist/`.

### Cara 2: Menggunakan Perintah Manual di Terminal
Jika ingin menjalankan perintah manual lewat PowerShell:
```powershell
cd C:\laragon\www\simoncer

# 1. Backup dulu sebelum update
powershell -ExecutionPolicy Bypass -File .\scripts\backup-simoncer.ps1

# 2. Tarik update dari Git (jika menggunakan GitHub)
git pull origin main

# 3. Install package & build ulang
npm.cmd install --legacy-peer-deps
npm.cmd run build
```

---

## 💾 BAGIAN 3: Cara Backup & Restore (Pemulihan)

### 1. Backup Kode & Konfigurasi Aplikasi
- **Manual 1x Klik:** Klik 2x **`1-BACKUP-SIMONCER.bat`**. File backup akan tersimpan di `C:\Backups\SIMONCER\`.
- **Otomatis Harian (Windows Task Scheduler di Server):**
  1. Buka **Task Scheduler** di Windows Server -> klik **Create Basic Task**.
  2. Beri nama: `Backup Harian SIMONCER`.
  3. Trigger: **Daily** (misal pukul `17:00`).
  4. Action: **Start a program**
     - Program/script: `powershell.exe`
     - Add arguments: `-NoProfile -ExecutionPolicy Bypass -File "C:\laragon\www\simoncer\scripts\backup-simoncer.ps1"`

### 2. Backup Data Sesi Pemeriksaan (LocalStorage Browser)
Untuk mencadangkan data sesi CAPA/pengaturan yang diinput melalui browser di server/PC:
1. Buka SIMONCER di browser -> tekan **`F12`** (Developer Tools) -> pilih tab **Console**.
2. Untuk **Export (Backup Data JSON)** ke file komputer, jalankan perintah ini di Console:
   ```javascript
   (() => {
     const data = {};
     for (let i = 0; i < localStorage.length; i++) {
       const k = localStorage.key(i);
       if (k && k.startsWith('simoncer')) data[k] = localStorage.getItem(k);
     }
     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
     const a = document.createElement('a');
     a.href = URL.createObjectURL(blob);
     a.download = `backup_data_simoncer_${new Date().toISOString().slice(0,10)}.json`;
     a.click();
   })();
   ```

### 3. Cara Restore (Mengembalikan ke Versi Sebelumnya Jika Terjadi Masalah)
Jika setelah update terjadi kendala dan Anda ingin kembali ke versi sebelumnya:
1. Buka folder **`C:\Backups\SIMONCER\`**.
2. Pilih file `simoncerv2_backup_YYYY-MM-DD_HHmmss.zip` sesuai tanggal/jam sebelum update.
3. Ekstrak (*Extract All*) isi file ZIP tersebut dan timpa (*Replace*) ke dalam folder `C:\laragon\www\simoncer\`.
4. Klik 2x **`3-JALANKAN-SERVER.bat`** (atau jalankan `npm.cmd run build`).
