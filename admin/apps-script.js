/**
 * ============================================================
 * MyRepublic Promo — Google Apps Script (Database Gratis)
 * ============================================================
 *
 * SETUP:
 * 1. Buat Google Sheet baru (nama bebas, misal "MyRep Orders")
 * 2. Extensions → Apps Script → hapus kode default → paste SEMUA isi file ini
 * 3. Save (Ctrl+S)
 * 4. Deploy → New deployment → Type: Web app
 *    - Description: MyRep API
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Authorize → Copy URL Web App
 * 6. Paste URL tersebut ke js/app.js → konstanta APPS_SCRIPT_URL
 *    dan ke admin/admin.js → konstanta APPS_SCRIPT_URL
 *
 * Sheet akan otomatis dibuat:
 *   - Orders   (pesanan)
 *   - Visitors (statistik pengunjung harian)
 * ============================================================
 */

const ADMIN_EMAIL = 'admin@silverhawk.web.id'; // ganti jika perlu
const ORDERS_SHEET = 'Orders';
const VISITORS_SHEET = 'Visitors';

// ---------- Helpers ----------
function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateId_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

// ---------- doPost ----------
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = (data.action || 'order').toLowerCase();

    if (action === 'order') {
      return handleNewOrder_(data);
    }
    if (action === 'update') {
      return handleUpdateStatus_(data);
    }
    if (action === 'visitor') {
      return handleVisitor_(data);
    }
    return jsonResponse_({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() });
  }
}

// ---------- doGet ----------
function doGet(e) {
  try {
    const action = (e.parameter.action || '').toLowerCase();
    if (action === 'list') {
      return handleListOrders_(e.parameter);
    }
    if (action === 'stats') {
      return handleGetStats_();
    }
    return ContentService.createTextOutput(
      'MyRepublic Order API is running. Use ?action=list or ?action=stats'
    );
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() });
  }
}

// ---------- Order: Create ----------
function handleNewOrder_(data) {
  const sheet = getOrCreateSheet_(ORDERS_SHEET, [
    'id', 'timestamp', 'name', 'wa', 'email', 'address', 'package', 'notes', 'status', 'source'
  ]);

  const id = data.id || generateId_();
  const ts = data.timestamp || new Date().toISOString();

  sheet.appendRow([
    id,
    ts,
    data.name || '',
    data.wa || '',
    data.email || '',
    data.address || '',
    data.package || '',
    data.notes || '',
    data.status || 'Baru',
    data.source || 'myrep.silverhawk.web.id'
  ]);

  // Email notifikasi
  try {
    const subject = '[MyRep Order] Pesanan Baru dari ' + (data.name || 'Pelanggan');
    const body =
      'Pesanan baru masuk dari website myrep.silverhawk.web.id\n\n' +
      'ID      : ' + id + '\n' +
      'Nama    : ' + (data.name || '-') + '\n' +
      'WA      : ' + (data.wa || '-') + '\n' +
      'Email   : ' + (data.email || '-') + '\n' +
      'Alamat  : ' + (data.address || '-') + '\n' +
      'Paket   : ' + (data.package || '-') + '\n' +
      'Catatan : ' + (data.notes || '-') + '\n' +
      'Waktu   : ' + ts + '\n\n' +
      'Silakan follow-up via WhatsApp.';
    MailApp.sendEmail(ADMIN_EMAIL, subject, body);
  } catch (mailErr) {
    // jangan gagalkan order kalau email gagal
  }

  return jsonResponse_({ status: 'ok', id: id });
}

// ---------- Order: Update status ----------
function handleUpdateStatus_(data) {
  if (!data.id || !data.status) {
    return jsonResponse_({ status: 'error', message: 'id and status required' });
  }
  const sheet = getOrCreateSheet_(ORDERS_SHEET, [
    'id', 'timestamp', 'name', 'wa', 'email', 'address', 'package', 'notes', 'status', 'source'
  ]);
  const last = sheet.getLastRow();
  if (last < 2) {
    return jsonResponse_({ status: 'error', message: 'No orders found' });
  }
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(data.id)) {
      sheet.getRange(i + 2, 9).setValue(data.status); // kolom status = 9
      return jsonResponse_({ status: 'ok', id: data.id, newStatus: data.status });
    }
  }
  return jsonResponse_({ status: 'error', message: 'Order not found: ' + data.id });
}

// ---------- Order: List ----------
function handleListOrders_(params) {
  const sheet = getOrCreateSheet_(ORDERS_SHEET, [
    'id', 'timestamp', 'name', 'wa', 'email', 'address', 'package', 'notes', 'status', 'source'
  ]);
  const last = sheet.getLastRow();
  if (last < 2) {
    return jsonResponse_({ status: 'ok', orders: [] });
  }
  const rows = sheet.getRange(2, 1, last - 1, 10).getValues();
  let orders = rows.map(function (r) {
    return {
      id: String(r[0]),
      timestamp: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
      name: r[2],
      wa: r[3],
      email: r[4],
      address: r[5],
      package: r[6],
      notes: r[7],
      status: r[8] || 'Baru',
      source: r[9]
    };
  });

  // filter by status if given
  if (params.status && params.status !== 'all') {
    orders = orders.filter(function (o) { return o.status === params.status; });
  }

  // newest first
  orders.sort(function (a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return jsonResponse_({ status: 'ok', orders: orders, total: orders.length });
}

// ---------- Visitor stats ----------
function handleVisitor_(data) {
  const sheet = getOrCreateSheet_(VISITORS_SHEET, [
    'date', 'day', 'week', 'month', 'year', 'total'
  ]);

  const now = new Date();
  const dateKey = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const last = sheet.getLastRow();

  // Cari baris hari ini
  let rowIdx = -1;
  if (last >= 2) {
    const dates = sheet.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i][0];
      const dStr = d instanceof Date
        ? Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd')
        : String(d);
      if (dStr === dateKey) {
        rowIdx = i + 2;
        break;
      }
    }
  }

  if (rowIdx > 0) {
    // increment day
    const cur = sheet.getRange(rowIdx, 2).getValue() || 0;
    sheet.getRange(rowIdx, 2).setValue(Number(cur) + 1);
  } else {
    // baris baru untuk hari ini
    let prevTotal = 0;
    if (last >= 2) {
      prevTotal = Number(sheet.getRange(last, 6).getValue()) || 0;
    }
    sheet.appendRow([dateKey, 1, 0, 0, 0, prevTotal + 1]);
    rowIdx = sheet.getLastRow();
  }

  // Recalculate week / month / year / total dari semua baris
  const all = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  const weekStart = getWeekStart_(now);
  const monthKey = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM');
  const yearKey = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy');

  let day = 0, week = 0, month = 0, year = 0, total = 0;
  all.forEach(function (r) {
    const d = r[0];
    const dStr = d instanceof Date
      ? Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd')
      : String(d);
    const cnt = Number(r[1]) || 0;
    total += cnt;
    if (dStr === dateKey) day = cnt;
    const dDate = d instanceof Date ? d : new Date(dStr);
    if (dDate >= weekStart) week += cnt;
    if (dStr.indexOf(monthKey) === 0) month += cnt;
    if (dStr.indexOf(yearKey) === 0) year += cnt;
  });

  // update baris hari ini dengan angka agregat
  sheet.getRange(rowIdx, 2, 1, 5).setValues([[day, week, month, year, total]]);

  return jsonResponse_({
    status: 'ok',
    stats: { day: day, week: week, month: month, year: year, total: total }
  });
}

function handleGetStats_() {
  const sheet = getOrCreateSheet_(VISITORS_SHEET, [
    'date', 'day', 'week', 'month', 'year', 'total'
  ]);
  const last = sheet.getLastRow();
  if (last < 2) {
    return jsonResponse_({
      status: 'ok',
      stats: { day: 0, week: 0, month: 0, year: 0, total: 0 }
    });
  }
  const row = sheet.getRange(last, 1, 1, 6).getValues()[0];
  return jsonResponse_({
    status: 'ok',
    stats: {
      day: Number(row[1]) || 0,
      week: Number(row[2]) || 0,
      month: Number(row[3]) || 0,
      year: Number(row[4]) || 0,
      total: Number(row[5]) || 0
    }
  });
}

function getWeekStart_(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}
