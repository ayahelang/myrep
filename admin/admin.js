(function () {
  'use strict';

  // ========== KONFIGURASI (boleh publik) ==========
  // URL Web App — bukan rahasia, tapi endpoint list/update dilindungi API_SECRET
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOUujHBYwDInWVrqKyVWhx-0lQOwADe1B_DjFxSiTzf_s-Iv_CDMU_BxsyYrqnd7gNvQ/exec';
  // ================================================
  // API_SECRET TIDAK disimpan di file ini.
  // Admin memasukkan secret saat login → disimpan di sessionStorage saja.

  const ADMIN_EMAILS = [
    'admin@silverhawk.web.id',
    'admin.silverhawk.web.id',
    'ted834r@gmail.com'
  ];

  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const passInput = document.getElementById('adminPass');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  let currentFilter = 'all';
  let allOrders = [];
  let loading = false;

  function getSecret() {
    return sessionStorage.getItem('myrep_api_secret') || '';
  }

  function setSecret(s) {
    if (s) sessionStorage.setItem('myrep_api_secret', s);
    else sessionStorage.removeItem('myrep_api_secret');
  }

  function isAdminFromSession() {
    if (getSecret()) return true;
    try {
      const u = JSON.parse(sessionStorage.getItem('myrep_user') || 'null');
      if (u && u.isAdmin) return true;
      if (u && u.email && ADMIN_EMAILS.some(a => a.toLowerCase() === u.email.toLowerCase())) return true;
    } catch {}
    return sessionStorage.getItem('myrep_admin') === '1';
  }

  function checkAuth() {
    if (isAdminFromSession()) {
      loginScreen.classList.add('hidden');
      dashboard.classList.remove('hidden');
      loadOrders();
    }
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  function statusClass(s) {
    const map = {
      'Baru': 'status-baru',
      'Proses': 'status-proses',
      'Selesai': 'status-selesai',
      'Batal': 'status-batal'
    };
    return map[s] || 'status-baru';
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  async function loadOrders() {
    if (!APPS_SCRIPT_URL) {
      try {
        allOrders = JSON.parse(localStorage.getItem('myrep_orders') || '[]');
      } catch {
        allOrders = [];
      }
      renderOrders();
      showSetupWarning('APPS_SCRIPT_URL belum diisi.');
      return;
    }

    loading = true;
    const empty = document.getElementById('emptyState');
    if (empty) empty.textContent = 'Memuat pesanan dari Google Sheets…';

    try {
      const secret = getSecret();
      const url = APPS_SCRIPT_URL +
        (APPS_SCRIPT_URL.includes('?') ? '&' : '?') +
        'action=list' +
        (secret ? '&key=' + encodeURIComponent(secret) : '');
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.orders)) {
        allOrders = data.orders;
        hideSetupWarning();
      } else if (data.message === 'Unauthorized') {
        allOrders = [];
        showSetupWarning('API_SECRET salah atau belum di-set di Script Properties. Logout lalu login lagi dengan secret yang benar.');
        if (empty) empty.textContent = 'Unauthorized — cek API_SECRET.';
      } else {
        allOrders = [];
        console.warn('Unexpected response', data);
      }
    } catch (err) {
      console.error('Gagal load orders:', err);
      allOrders = [];
      if (empty) empty.textContent = 'Gagal memuat data. Cek koneksi & deployment Apps Script.';
    }
    loading = false;
    renderOrders();
  }

  function showSetupWarning(msg) {
    let warn = document.getElementById('setupWarn');
    if (!warn) {
      warn = document.createElement('div');
      warn.id = 'setupWarn';
      warn.style.cssText = 'background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:14px 18px;margin-bottom:16px;font-size:0.9rem;color:#92400e';
      const card = document.querySelector('.card');
      if (card) card.parentNode.insertBefore(warn, card);
    }
    warn.innerHTML = '<strong>⚠️ Perhatian:</strong> ' + (msg || '');
    warn.style.display = 'block';
  }

  function hideSetupWarning() {
    const warn = document.getElementById('setupWarn');
    if (warn) warn.style.display = 'none';
  }

  function renderOrders() {
    const filtered = currentFilter === 'all'
      ? allOrders
      : allOrders.filter(o => o.status === currentFilter);

    const body = document.getElementById('ordersBody');
    const table = document.getElementById('ordersTable');
    const empty = document.getElementById('emptyState');

    document.getElementById('statTotal').textContent = allOrders.length;
    document.getElementById('statBaru').textContent = allOrders.filter(o => o.status === 'Baru').length;
    document.getElementById('statProses').textContent = allOrders.filter(o => o.status === 'Proses').length;
    document.getElementById('statSelesai').textContent = allOrders.filter(o => o.status === 'Selesai').length;

    if (filtered.length === 0) {
      table.classList.add('hidden');
      empty.classList.remove('hidden');
      if (!loading) {
        empty.textContent = currentFilter === 'all'
          ? 'Belum ada pesanan. Pesanan dari form akan muncul di sini.'
          : 'Tidak ada pesanan dengan status ini.';
      }
      return;
    }

    empty.classList.add('hidden');
    table.classList.remove('hidden');

    body.innerHTML = filtered.map(o => `
      <tr data-id="${escapeHtml(o.id)}">
        <td>${formatTime(o.timestamp)}</td>
        <td>
          <strong>${escapeHtml(o.name || '-')}</strong>
          ${o.email ? `<br><small style="color:#64748b">${escapeHtml(o.email)}</small>` : ''}
          ${o.address ? `<br><small style="color:#64748b;max-width:180px;display:inline-block">${escapeHtml(o.address).slice(0, 60)}${o.address.length > 60 ? '…' : ''}</small>` : ''}
        </td>
        <td>
          <a href="https://wa.me/${(o.wa || '').replace(/\D/g, '').replace(/^0/, '62')}" target="_blank" rel="noopener" style="color:#7C3AED;font-weight:600">
            ${escapeHtml(o.wa || '-')}
          </a>
        </td>
        <td>${escapeHtml(o.package || '-')}</td>
        <td><span class="status ${statusClass(o.status)}">${escapeHtml(o.status || 'Baru')}</span></td>
        <td style="white-space:nowrap">
          ${o.status === 'Baru' ? `<button class="btn btn-sm btn-warn" data-action="proses" data-id="${escapeHtml(o.id)}">Proses</button>` : ''}
          ${o.status === 'Proses' ? `<button class="btn btn-sm btn-success" data-action="selesai" data-id="${escapeHtml(o.id)}">Selesai</button>` : ''}
          ${o.status !== 'Selesai' && o.status !== 'Batal' ? `<button class="btn btn-sm btn-outline" data-action="batal" data-id="${escapeHtml(o.id)}">Batal</button>` : ''}
          ${o.status === 'Selesai' || o.status === 'Batal' ? `<button class="btn btn-sm btn-outline" data-action="baru" data-id="${escapeHtml(o.id)}">Reset</button>` : ''}
        </td>
      </tr>
    `).join('');

    body.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const map = { proses: 'Proses', selesai: 'Selesai', batal: 'Batal', baru: 'Baru' };
        updateStatus(id, map[action]);
      });
    });
  }

  async function updateStatus(id, status) {
    const idx = allOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      allOrders[idx].status = status;
      renderOrders();
    }

    if (!APPS_SCRIPT_URL) return;

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update',
          id: id,
          status: status,
          key: getSecret()
        })
      });
      setTimeout(loadOrders, 1200);
    } catch (err) {
      console.error('Update gagal:', err);
      alert('Gagal update status. Coba refresh halaman.');
      loadOrders();
    }
  }

  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderOrders();
    });
  });

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Memuat…';
      loadOrders().finally(() => {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '↻ Refresh';
      });
    });
  }

  // Login: input = API_SECRET dari Script Properties (bukan password hardcoded)
  loginBtn.addEventListener('click', async () => {
    const val = (passInput.value || '').trim();
    if (!val) {
      alert('Masukkan API_SECRET (dari Script Properties Apps Script)');
      return;
    }

    // Jika Apps Script belum set API_SECRET, terima saja (mode setup)
    // Jika sudah set, validasi lewat endpoint (opsional — list akan gagal jika salah)
    setSecret(val);
    sessionStorage.setItem('myrep_admin', '1');
    passInput.value = '';
    checkAuth();
  });

  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('myrep_admin');
    sessionStorage.removeItem('myrep_user');
    setSecret('');
    location.href = '../';
  });

  checkAuth();
})();
