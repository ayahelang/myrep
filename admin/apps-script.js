/**
 * Google Apps Script untuk MyRepublic Order Form
 * 
 * Cara pakai:
 * 1. Buka Google Sheet → Extensions → Apps Script
 * 2. Paste seluruh kode ini
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy URL, paste ke js/app.js → APPS_SCRIPT_URL
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];

    // Pastikan header ada
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Nama', 'Alamat', 'Email', 'WA', 'Paket', 'Catatan', 'Status']);
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.address || '',
      data.email || '',
      data.wa || '',
      data.package || '',
      data.notes || '',
      'Baru'
    ]);

    // Kirim email notifikasi ke admin
    const adminEmail = 'admin@silverhawk.web.id';
    const subject = '[MyRep Order] Pesanan Baru dari ' + (data.name || 'Pelanggan');
    const body = 
`Pesanan baru masuk dari website myrep.silverhawk.web.id

Nama   : ${data.name}
Alamat : ${data.address}
Email  : ${data.email}
WA     : ${data.wa}
Paket  : ${data.package}
Catatan: ${data.notes || '-'}
Waktu  : ${data.timestamp}

Silakan follow-up via WhatsApp.
`;

    MailApp.sendEmail(adminEmail, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('MyRepublic Order API is running');
}
