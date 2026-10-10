# MyRepublic Promo Site
**URL:** https://myrep.silverhawk.web.id

Situs pemasaran paket internet MyRepublic (Fiber Optic).

## Fitur
- Landing page modern, responsif, cepat
- Daftar paket dari `data/packages.json`
- Form order → WhatsApp langsung ke **08515-9922-358** (Teddy Mulyana)
- Opsional: simpan ke Google Sheets + email notifikasi via Apps Script
- Panel admin sederhana (`/admin/`)

## Struktur
```
├── index.html
├── css/style.css
├── js/app.js
├── data/packages.json
├── admin/
│   ├── index.html
│   ├── admin.js
│   └── apps-script.js   ← kode Google Apps Script
└── README.md
```

## Setup Database (Google Sheets — Gratis)
1. Buat Google Sheet baru
2. Extensions → Apps Script → paste isi `admin/apps-script.js`
3. Deploy as Web App (Anyone)
4. Copy URL → paste ke `js/app.js` pada konstanta `APPS_SCRIPT_URL`

## Brand Color
- Merah MyRepublic: `#E31E24`
- Background gelap modern

## Deploy
Upload seluruh isi folder ini ke repository GitHub Pages subdomain `myrep.silverhawk.web.id`.

Powered by silverhawk.web.id
