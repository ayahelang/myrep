(function () {
  'use strict';

  // ========== KONFIGURASI ==========
  // Paste URL Web App dari Google Apps Script di sini (sama dengan js/app.js)
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOUujHBYwDInWVrqKyVWhx-0lQOwADe1B_DjFxSiTzf_s-Iv_CDMU_BxsyYrqnd7gNvQ/exec';
  // =================================

  const PASS = 'myrep2026';
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

  function isAdminFromSession() {
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

  // ---------- Load from Google Sheets via Apps Script ----------
  async function loadOrders() {
    if (!APPS_SCRIPT_URL) {
      // Fallback ke localStorage jika belum setup
      try {
        allOrders = JSON.parse(localStorage.getItem('myrep_orders') || '[]');
      } catch {
        allOrders = [];
      }
      renderOrders();
      showSetupWarning();
      return;
    }

    loading = true;
    const empty = document.getElementById('emptyState');
    if (empty) empty.textContent = 'Memuat pesanan dari Google Sheets…';

    try {
      const url = APPS_SCRIPT_URL + (APPS_SCRIPT_URL.includes('?') ? '&' : '?') + 'action=list';
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.orders)) {
        allOrders = data.orders;
      } else {
        allOrders = [];
        console.warn('Unexpected response', data);
      }
    } catch (err) {
      console.error('Gagal load orders:', err);
      allOrders = [];
      if (empty) empty.textContent = 'Gagal memuat data. Cek APPS_SCRIPT_URL & deployment.';
    }
    loading = false;
    renderOrders();
  }

  function showSetupWarning() {
    const card = document.querySelector('.card');
    if (!card || document.getElementById('setupWarn')) return;
    const warn = document.createElement('div');
    warn.id = 'setupWarn';
    warn.style.cssText = 'background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:14px 18px;margin-bottom:16px;font-size:0.9rem;color:#92400e';
    warn.innerHTML = '<strong>⚠️ Belum terhubung ke Google Sheets.</strong><br>Isi <code>APPS_SCRIPT_URL</code> di <code>admin/admin.js</code> dan <code>js/app.js</code> setelah deploy Apps Script. Sementara menampilkan data localStorage (hanya di browser ini).';
    card.parentNode.insertBefore(warn, card);
  }

  function renderOrders() {
    const filtered = currentFilter === 'all'
      ? allOrders
      : allOrders.filter(o => o.status === currentFilter);

    const body = document.getElementById('ordersBody');
    const table = document.getElementById('ordersTable');
    const empty = document.getElementById('emptyState');

    // Stats
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
    // Optimistic UI
    const idx = allOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      allOrders[idx].status = status;
      renderOrders();
    }

    if (!APPS_SCRIPT_URL) {
      // Fallback localStorage
      try {
        const orders = JSON.parse(localStorage.getItem('myrep_orders') || '[]');
        const i = orders.findIndex(o => o.id === id);
        if (i !== -1) {
          orders[i].status = status;
          localStorage.setItem('myrep_orders', JSON.stringify(orders));
        }
      } catch {}
      return;
    }

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'update', id: id, status: status })
      });
      // no-cors: tidak bisa baca response, tapi biasanya berhasil
      // Reload setelah 1.2s untuk sync
      setTimeout(loadOrders, 1200);
    } catch (err) {
      console.error('Update gagal:', err);
      alert('Gagal update status. Coba refresh halaman.');
      loadOrders();
    }
  }

  // Filters
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderOrders();
    });
  });

  // Refresh button
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

  loginBtn.addEventListener('click', () => {
    if (passInput.value === PASS) {
      sessionStorage.setItem('myrep_admin', '1');
      checkAuth();
    } else {
      alert('Password salah');
    }
  });

  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('myrep_admin');
    sessionStorage.removeItem('myrep_user');
    location.href = '../';
  });

  checkAuth();
})();
