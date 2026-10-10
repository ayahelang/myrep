/* =========================================================
   MyRepublic Promo — app.js
   Brand: putih, ungu, biru + Google Login + Admin
========================================================= */
(function () {
  'use strict';

  const WA_NUMBER = '6285159922358'; // Teddy Mulyana
  const APPS_SCRIPT_URL = ''; // Isi setelah deploy Google Apps Script (opsional)

  // Admin emails yang boleh akses panel admin
  const ADMIN_EMAILS = [
    'admin@silverhawk.web.id',
    'admin.silverhawk.web.id',
    'ted834r@gmail.com'
  ];

  // Google Client ID — ganti dengan Client ID dari Google Cloud Console
  // (OAuth 2.0 Client ID untuk Web, authorized origin: myrep.silverhawk.web.id)
  const GOOGLE_CLIENT_ID = ''; // biarkan kosong untuk mode demo (klik = simulasikan)

  let packages = [];
  let contact = {};
  let currentUser = null; // { email, name, picture, isAdmin }

  // ---------- Load data ----------
  async function loadData() {
    try {
      const res = await fetch('data/packages.json');
      const data = await res.json();
      packages = data.packages || [];
      contact = data.contact || {};
      renderPackages();
      populateSelect();
    } catch (err) {
      console.error('Gagal load packages:', err);
      showToast('Gagal memuat data paket');
    }
  }

  // ---------- Render packages ----------
  function renderPackages() {
    const grid = document.getElementById('packagesGrid');
    if (!grid) return;

    grid.innerHTML = packages.map(pkg => `
      <div class="pkg-card ${pkg.popular ? 'popular' : ''}" data-id="${pkg.id}">
        ${pkg.popular ? '<span class="pkg-badge">Paling Laris</span>' : ''}
        <div class="pkg-name">${pkg.name}</div>
        <div class="pkg-speed">${pkg.speed}</div>
        <div class="pkg-price">${pkg.priceDisplay}</div>
        <div class="pkg-period">${pkg.period}</div>
        <ul class="pkg-features">
          ${pkg.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <button class="btn-pkg" data-pkg="${pkg.id}">Pilih Paket</button>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-pkg').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pkg;
        const select = document.getElementById('packageSelect');
        if (select) {
          select.value = id;
          document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function populateSelect() {
    const select = document.getElementById('packageSelect');
    if (!select) return;
    select.innerHTML = '<option value="">— Pilih Paket —</option>' +
      packages.map(p => `<option value="${p.id}">${p.name} — ${p.speed} (${p.priceDisplay})</option>`).join('');
  }

  // ---------- Orders (localStorage) ----------
  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem('myrep_orders') || '[]');
    } catch {
      return [];
    }
  }

  function saveOrder(order) {
    const orders = getOrders();
    orders.unshift({
      ...order,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      status: 'Baru',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('myrep_orders', JSON.stringify(orders));
  }

  // ---------- Form submit ----------
  function buildWaMessage(formData) {
    const pkg = packages.find(p => p.id === formData.package) || {};
    return encodeURIComponent(
`Halo, saya ingin berlangganan MyRepublic.

*Data Pemesan:*
Nama: ${formData.name}
Alamat: ${formData.address}
Email: ${formData.email}
No. WA: ${formData.wa}

*Paket yang dipilih:*
${pkg.name || formData.package} — ${pkg.speed || ''} (${pkg.priceDisplay || ''})

Mohon diproses. Terima kasih!`
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = {
      name: form.name.value.trim(),
      address: form.address.value.trim(),
      email: form.email.value.trim(),
      wa: form.wa.value.trim(),
      package: form.package.value,
      notes: form.notes.value.trim()
    };

    if (!formData.name || !formData.address || !formData.wa || !formData.package) {
      showToast('Mohon lengkapi data yang wajib diisi');
      return;
    }

    // Simpan ke localStorage (untuk panel admin)
    saveOrder(formData);

    // Optional: kirim ke Google Apps Script
    if (APPS_SCRIPT_URL) {
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            timestamp: new Date().toISOString(),
            source: 'myrep.silverhawk.web.id'
          })
        });
      } catch (err) {
        console.warn('Apps Script error (ignored):', err);
      }
    }

    // Buka WhatsApp
    const msg = buildWaMessage(formData);
    const url = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    window.open(url, '_blank');

    showToast('Pesanan tersimpan & mengarahkan ke WhatsApp...');
    form.reset();
  }

  // ---------- Toast ----------
  function showToast(msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ---------- Mobile nav ----------
  function initNav() {
    const burger = document.getElementById('burger');
    const links = document.getElementById('navLinks');
    if (!burger || !links) return;

    burger.addEventListener('click', () => {
      links.classList.toggle('open');
    });

    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  // ---------- Auth (Google) ----------
  function isAdminEmail(email) {
    if (!email) return false;
    const e = email.toLowerCase().trim();
    return ADMIN_EMAILS.some(a => a.toLowerCase() === e);
  }

  function updateAuthUI() {
    const btn = document.getElementById('authBtn');
    const text = document.getElementById('authBtnText');
    if (!btn || !text) return;

    if (currentUser) {
      if (currentUser.isAdmin) {
        btn.classList.add('admin-mode');
        text.textContent = 'Panel Admin';
        btn.title = 'Buka / Keluar Panel Admin';
      } else {
        btn.classList.remove('admin-mode');
        text.textContent = currentUser.name || currentUser.email;
        btn.title = 'Logout';
      }
      // optional avatar
      let av = btn.querySelector('.user-avatar');
      if (currentUser.picture) {
        if (!av) {
          av = document.createElement('img');
          av.className = 'user-avatar';
          av.alt = '';
          btn.insertBefore(av, text);
        }
        av.src = currentUser.picture;
      }
    } else {
      btn.classList.remove('admin-mode');
      text.textContent = 'Login with Google';
      btn.title = 'Login with Google';
      const av = btn.querySelector('.user-avatar');
      if (av) av.remove();
    }
  }

  function handleCredentialResponse(response) {
    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      currentUser = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        isAdmin: isAdminEmail(payload.email)
      };
      sessionStorage.setItem('myrep_user', JSON.stringify(currentUser));
      updateAuthUI();
      showToast(currentUser.isAdmin ? 'Login admin berhasil' : 'Login berhasil');
      if (currentUser.isAdmin) {
        // langsung ke panel
        window.location.href = 'admin/';
      }
    } catch (err) {
      console.error('Gagal decode credential:', err);
      showToast('Login gagal');
    }
  }

  function initGoogleAuth() {
    const btn = document.getElementById('authBtn');
    if (!btn) return;

    // Restore session
    try {
      const saved = sessionStorage.getItem('myrep_user');
      if (saved) {
        currentUser = JSON.parse(saved);
        updateAuthUI();
      }
    } catch {}

    btn.addEventListener('click', () => {
      if (currentUser) {
        if (currentUser.isAdmin) {
          // Toggle: masuk panel admin
          window.location.href = 'admin/';
          return;
        }
        // Logout biasa
        currentUser = null;
        sessionStorage.removeItem('myrep_user');
        updateAuthUI();
        showToast('Logout berhasil');
        return;
      }

      // Login
      if (GOOGLE_CLIENT_ID && window.google && google.accounts) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse
        });
        google.accounts.id.prompt();
      } else {
        // Mode demo: prompt email sederhana
        const email = prompt('Demo Login — masukkan email Google Anda:\n(admin@silverhawk.web.id atau ted834r@gmail.com untuk akses admin)');
        if (!email) return;
        currentUser = {
          email: email.trim(),
          name: email.split('@')[0],
          picture: null,
          isAdmin: isAdminEmail(email)
        };
        sessionStorage.setItem('myrep_user', JSON.stringify(currentUser));
        updateAuthUI();
        showToast(currentUser.isAdmin ? 'Login admin (demo) berhasil' : 'Login (demo) berhasil');
        if (currentUser.isAdmin) {
          window.location.href = 'admin/';
        }
      }
    });
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initNav();
    initGoogleAuth();
    const form = document.getElementById('orderForm');
    if (form) form.addEventListener('submit', handleSubmit);
  });
})();
