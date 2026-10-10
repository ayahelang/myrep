(function () {
  'use strict';

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
      renderOrders();
    }
  }

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem('myrep_orders') || '[]');
    } catch {
      return [];
    }
  }

  function saveOrders(orders) {
    localStorage.setItem('myrep_orders', JSON.stringify(orders));
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

  function renderOrders() {
    const orders = getOrders();
    const filtered = currentFilter === 'all'
      ? orders
      : orders.filter(o => o.status === currentFilter);

    const body = document.getElementById('ordersBody');
    const table = document.getElementById('ordersTable');
    const empty = document.getElementById('emptyState');

    // Stats
    document.getElementById('statTotal').textContent = orders.length;
    document.getElementById('statBaru').textContent = orders.filter(o => o.status === 'Baru').length;
    document.getElementById('statProses').textContent = orders.filter(o => o.status === 'Proses').length;
    document.getElementById('statSelesai').textContent = orders.filter(o => o.status === 'Selesai').length;

    if (filtered.length === 0) {
      table.classList.add('hidden');
      empty.classList.remove('hidden');
      empty.textContent = currentFilter === 'all'
        ? 'Belum ada pesanan. Pesanan dari form akan muncul di sini.'
        : 'Tidak ada pesanan dengan status ini.';
      return;
    }

    empty.classList.add('hidden');
    table.classList.remove('hidden');

    body.innerHTML = filtered.map(o => `
      <tr data-id="${o.id}">
        <td>${formatTime(o.timestamp)}</td>
        <td>
          <strong>${escapeHtml(o.name || '-')}</strong>
          ${o.email ? `<br><small style="color:#64748b">${escapeHtml(o.email)}</small>` : ''}
          ${o.address ? `<br><small style="color:#64748b;max-width:180px;display:inline-block">${escapeHtml(o.address).slice(0, 60)}${o.address.length > 60 ? '…' : ''}</small>` : ''}
        </td>
        <td>
          <a href="https://wa.me/${(o.wa || '').replace(/\D/g, '').replace(/^0/, '62')}" target="_blank" style="color:#7C3AED;font-weight:600">
            ${escapeHtml(o.wa || '-')}
          </a>
        </td>
        <td>${escapeHtml(o.package || '-')}</td>
        <td><span class="status ${statusClass(o.status)}">${escapeHtml(o.status || 'Baru')}</span></td>
        <td style="white-space:nowrap">
          ${o.status === 'Baru' ? `<button class="btn btn-sm btn-warn" data-action="proses" data-id="${o.id}">Proses</button>` : ''}
          ${o.status === 'Proses' ? `<button class="btn btn-sm btn-success" data-action="selesai" data-id="${o.id}">Selesai</button>` : ''}
          ${o.status !== 'Selesai' && o.status !== 'Batal' ? `<button class="btn btn-sm btn-outline" data-action="batal" data-id="${o.id}">Batal</button>` : ''}
          ${o.status === 'Selesai' || o.status === 'Batal' ? `<button class="btn btn-sm btn-outline" data-action="baru" data-id="${o.id}">Reset</button>` : ''}
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

  function updateStatus(id, status) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return;
    orders[idx].status = status;
    saveOrders(orders);
    renderOrders();
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
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
