# MyRepublic Promo Site
**URL:** https://myrep.silverhawk.web.id

Situs pemasaran paket internet MyRepublic (Fiber Optic) dengan database gratis Google Sheets + Apps Script.

## Fitur
- Landing page modern, responsif — putih + aksen ungu & biru
- Form order → WhatsApp + **Google Sheets** + email notifikasi
- Panel admin dilindungi **API_SECRET** (tidak disimpan di GitHub)
- Statistik pengunjung di Sheets
- Speed Test floating + auto-scroll idle

## Keamanan (penting)
| Data | Di mana disimpan |
|------|------------------|
| `APPS_SCRIPT_URL` | `js/app.js` & `admin/admin.js` (boleh publik) |
| `API_SECRET` | **Script Properties** saja + diisi manual saat login admin |
| `ADMIN_EMAIL` | **Script Properties** saja |
| Password hardcoded | **Dihapus** — diganti API_SECRET |

Endpoint **list** & **update** menolak request tanpa `key` yang cocok dengan `API_SECRET`.  
Form order (publik) tidak butuh key.

---

## Setup Database + Script Properties

### 1. Google Sheet + Apps Script
1. Buat Google Sheet baru  
2. **Extensions → Apps Script** → paste isi `admin/apps-script.js` → Save  
3. **Project Settings** (ikon roda gigi) → **Script Properties** → Add:

   | Property | Value |
   |----------|--------|
   | `ADMIN_EMAIL` | `admin@silverhawk.web.id` (atau email kamu) |
   | `API_SECRET` | string acak panjang (contoh: buat di randomkeygen.com) |

4. **Deploy → New deployment → Web app**  
   - Execute as: **Me**  
   - Who has access: **Anyone**  
5. Authorize → copy URL Web App

### 2. Isi URL di situs
Paste URL ke:
- `js/app.js` → `APPS_SCRIPT_URL`
- `admin/admin.js` → `APPS_SCRIPT_URL`

**Jangan** taruh `API_SECRET` di file ini.

### 3. Login admin
Buka `/admin/` → masukkan **API_SECRET** yang sama dengan Script Properties.  
Secret hanya disimpan di `sessionStorage` browser (hilang saat tab ditutup).

---

## Google Login (opsional)
1. OAuth 2.0 Client ID (Web) di Google Cloud Console  
2. Authorized origins: `https://myrep.silverhawk.web.id`  
3. Paste Client ID ke `js/app.js` → `GOOGLE_CLIENT_ID`

---

## Deploy GitHub Pages
Upload isi folder ini ke repo. Custom domain sudah di `CNAME`.

Setelah ubah Apps Script, **Deploy lagi** (Manage deployments → Edit → New version) agar perubahan aktif.

Powered by silverhawk.web.id
