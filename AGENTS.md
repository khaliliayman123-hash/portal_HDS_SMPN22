# Petunjuk Pengembangan Proyek (Project Development Guidelines)

Dokumen ini berisi aturan kustom, konfigurasi lingkungan, dan aturan pertukaran data wali kelas untuk proyek dashboard dan manajemen sekolah ini. Simpan dokumen ini agar asisten AI atau pengembang lain dapat langsung mengenali struktur dan logika krusial aplikasi tanpa merusak sistem yang ada.

---

## 1. Variabel Lingkungan Utama (Environment Variables)

Aplikasi ini terintegrasi dengan Google Sheets sebagai basis data melalui Google Apps Script (GAS). Dua variabel lingkungan utama yang wajib dikonfigurasi di lingkungan hosting (seperti Vercel) adalah:

| Variabel | Deskripsi | Nilai Default / Contoh |
| :--- | :--- | :--- |
| `VITE_SPREADSHEET_ID` | ID Google Spreadsheet yang digunakan untuk menyimpan seluruh tabel database. | `1g3thopFbDdsvlXyidgq_PEiiEhY5cH3PngqGO5weHqc` |
| `VITE_GAS_API_URL` | URL Endpoint Web App dari Google Apps Script hasil deploy (`google_apps_script/`). | `https://script.google.com/macros/s/AKfycbwL5nTSIsbpgFE6JxD2STMWQiFezjN8Dw6xTg_ktbtVUOHTvLinLFuu6ojYe0QP9bZm/exec` |

> ⚠️ **PENTING UNTUK DEPLOYMENT (Vercel/GitHub):**
> Saat melakukan push ke GitHub yang terhubung ke Vercel, pastikan kedua variabel lingkungan di atas sudah dimasukkan di **Vercel Project Settings > Environment Variables** dengan prefix `VITE_`. Jika tidak diisi, aplikasi akan menggunakan nilai cadangan (fallback) di dalam kode `src/services/api.ts`.

---

## 2. Aturan Khusus Pertukaran Wali Kelas (Wali Kelas Swap Rules)

Terdapat aturan khusus terkait pembagian kelas untuk Wali Kelas **Ifah Siti Latifah** (`ifah`) dan **Nani Saidah** (`nani`). Pertukaran ini dikunci secara hardcoded di dalam sistem agar data tetap sinkron dan konsisten:

### Definisi Swapping:
* **Username `ifah` (ID: `wk-9-1`)** dialokasikan untuk memegang **Kelas 9-1** (Secara default sistem harus membaca ini sebagai Kelas 9-1).
* **Username `nani` (ID: `wk-9-7`)** dialokasikan untuk memegang **Kelas 9-7** (Secara default sistem harus membaca ini sebagai Kelas 9-7).

### Tempat Implementasi Aturan Ini (Wajib Dipertahankan):
1. **`src/services/api.ts` (WALI_KELAS_USERS)**:
   ```typescript
   { id: 'wk-9-1', username: 'ifah', nama: 'Ifah Siti Latifah, A.K, S.Pd', role: UserRole.WALI_KELAS, email: 'ifah@sekolah.sch.id', isActive: true },
   ...
   { id: 'wk-9-7', username: 'nani', nama: 'Nani Saidah, S.Pd', role: UserRole.WALI_KELAS, email: 'nani@sekolah.sch.id', isActive: true }
   ```
2. **`src/services/api.ts` (Sinkronisasi Database / Migration)**:
   Fungsi sinkronisasi database harus mengoreksi jika ada inkonsistensi dari Google Sheets dengan mencocokkan properti `username`, `nama`, dan `email` berdasarkan data master `WALI_KELAS_USERS`.
3. **`src/components/WaliKelasView.tsx`**:
   Fungsi mapping kelas berdasarkan username di dalam tampilan komponen:
   ```typescript
   const mapping: Record<string, string> = {
     nani: 'Kelas 9-7',
     ana: 'Kelas 9-2',
     monica: 'Kelas 9-3',
     indri: 'Kelas 9-4',
     wahyunis: 'Kelas 9-5',
     titin: 'Kelas 9-6',
     ifah: 'Kelas 9-1'
   };
   ```

---

## 3. Arsitektur Data & Google Apps Script

* **Database Offline-First/Sync**: Aplikasi menggunakan sinkronisasi data lokal (IndexedDB/State/LocalStorage) yang terhubung secara berkala dengan Google Sheets API via GAS.
* **Script Google Apps Script**: Kode GAS berada di folder `/google_apps_script`. Jika melakukan modifikasi skema data di spreadsheet, pastikan file `.gs` yang relevan di-update dan di-redeploy di Konsol GAS Anda untuk mendapatkan URL Web App terbaru.

---

## 4. Konfigurasi Deployment (Vercel)

Aplikasi dibangun menggunakan **React 18** + **Vite** + **TypeScript**.
* File konfigurasi SPA routing untuk Vercel didefinisikan di `vercel.json`:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
* Perintah Build: `npm run build`
* Direktori Output: `dist`
