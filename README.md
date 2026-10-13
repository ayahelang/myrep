# MyRepublic Promo Site
**URL:** https://myrep.silverhawk.web.id

Situs pemasaran paket internet MyRepublic (Fiber Optic) dengan database gratis Google Sheets + Apps Script.

## Fitur
- Landing page modern, responsif — **warna dasar putih, aksen ungu & biru**
- Daftar paket dari `data/packages.json`
- Form order → WhatsApp + simpan ke **Google Sheets**
- Email notifikasi otomatis ke admin saat ada pesanan baru
- **Login with Google** (ikon di navbar)
  - Email admin → tombol jadi **Panel Admin**
- Panel admin (`/admin/`) — baca & ubah status pesanan langsung dari Google Sheets
- Statistik pengunjung (hari/minggu/bulan/tahun) tersimpan di Sheets
- Speed Test floating + auto-scroll idle

## Brand Color
- Putih (background)
- Ungu: `#7C3AED`
- Biru: `#2563EB`

---

## Setup Database (Google Sheets — Gratis) — WAJIB

1. Buat **Google Sheet baru** (nama bebas, misal `MyRep Orders`)
2. Buka **Extensions → Apps Script**
3. Hapus kode default, lalu **paste seluruh isi** file `admin/apps-script.js`
4. Klik **Save** (ikon disket)
5. Klik **Deploy → New deployment**
   - Type: **Web app**
   - Description: `MyRep API`
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Klik **Deploy** → Authorize (pilih akun Google kamu) → **Allow**
7. **Copy URL** Web App (bentuknya `https://script.google.com/macros/s/xxxxx/exec`)
8. Paste URL tersebut ke **dua tempat**:
   - `js/app.js` → konstanta `APPS_SCRIPT_URL`
   - `admin/admin.js` → konstanta `APPS_SCRIPT_URL`

Setelah itu, Sheet akan otomatis membuat tab **Orders** dan **Visitors**.

### Email notifikasi
Default mengirim ke `admin@silverhawk.web.id`.  
Ganti di baris `const ADMIN_EMAIL = '...'` di dalam `apps-script.js` jika perlu.

---

## Google Login (opsional, produksi)

1. Buat OAuth 2.0 Client ID di [Google Cloud Console](https://console.cloud.google.com/) (type: Web)
2. Authorized JavaScript origins: `https://myrep.silverhawk.web.id`
3. Paste Client ID ke `js/app.js` → `GOOGLE_CLIENT_ID`

Tanpa Client ID, mode demo: klik tombol → prompt email.

Admin emails (bisa diubah di `js/app.js` & `admin/admin.js`):
- `admin@silverhawk.web.id`
- `ted834r@gmail.com`

Password panel admin (fallback): `myrep2026`

---

## Deploy ke GitHub Pages

1. Upload **seluruh isi folder ini** (bukan folder pembungkus) ke repository GitHub
2. Settings → Pages → Source: Deploy from branch `main` / `docs` atau root
3. Custom domain: `myrep.silverhawk.web.id` (sudah ada file `CNAME`)

Pastikan `APPS_SCRIPT_URL` sudah diisi sebelum atau sesudah deploy.

---

## Struktur penting

```
├── index.html          # Landing page
├── js/app.js           # Logika utama + order + visitor
├── data/packages.json  # Daftar paket
├── admin/
│   ├── index.html      # Panel admin
│   ├── admin.js        # Baca/update order dari Sheets
│   └── apps-script.js  # Kode yang di-paste ke Google Apps Script
└── css/style.css
```

Powered by silverhawk.web.id
