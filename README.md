# MyRepublic Promo Site
**URL:** https://myrep.silverhawk.web.id

Situs pemasaran paket internet MyRepublic (Fiber Optic).

## Fitur
- Landing page modern, responsif, cepat — **warna dasar putih, aksen ungu & biru**
- Daftar paket dari `data/packages.json`
- Form order → WhatsApp langsung ke **08515-9922-358** (Teddy Mulyana)
- Pesanan juga disimpan ke localStorage untuk panel admin
- **Login with Google** (ikon di navbar)
  - Jika login dengan `admin@silverhawk.web.id` atau `ted834r@gmail.com` → tombol berubah menjadi **Panel Admin**
  - Panel admin: lihat pesanan (baru / sudah ditindaklanjuti), ubah status
- Opsional: simpan ke Google Sheets + email notifikasi via Apps Script
- Panel admin (`/admin/`) — password default: `myrep2026`

## Brand Color
- Putih (background)
- Ungu: `#7C3AED`
- Biru: `#2563EB`

## Google Login (produksi)
1. Buat OAuth 2.0 Client ID di Google Cloud Console (type: Web)
2. Authorized JavaScript origins: `https://myrep.silverhawk.web.id`
3. Paste Client ID ke `js/app.js` → `GOOGLE_CLIENT_ID`

Tanpa Client ID, mode demo: klik tombol → prompt email.

## Setup Database (Google Sheets — Gratis)
1. Buat Google Sheet baru
2. Extensions → Apps Script → paste isi `admin/apps-script.js`
3. Deploy as Web App (Anyone)
4. Copy URL → paste ke `js/app.js` pada konstanta `APPS_SCRIPT_URL`

## Deploy
Upload seluruh isi folder ini ke repository GitHub Pages subdomain `myrep.silverhawk.web.id`.

Powered by silverhawk.web.id
