/* =========================================================
   MyRepublic Promo — app.js
   Brand: putih, ungu, biru + Google Login + Admin
   + Speed Test + Floating WA + Auto-scroll idle + Visitor stats
========================================================= */
(function () {
  'use strict';

  const WA_NUMBER = '6285159922358';
  const APPS_SCRIPT_URL = '';
  const ADMIN_EMAILS = [
    'admin@silverhawk.web.id',
    'admin.silverhawk.web.id',
    'ted834r@gmail.com'
  ];
  const GOOGLE_CLIENT_ID = '';

  let packages = [];
  let contact = {};
  let currentUser = null;

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
        const select = document.getElementById('packageSelect');
        if (select) {
          select.value = btn.dataset.pkg;
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

  // ---------- Orders ----------
  function getOrders() {
    try { return JSON.parse(localStorage.getItem('myrep_orders') || '[]'); }
    catch { return []; }
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
    saveOrder(formData);
    if (APPS_SCRIPT_URL) {
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, timestamp: new Date().toISOString(), source: 'myrep.silverhawk.web.id' })
        });
      } catch (err) { console.warn(err); }
    }
    window.open(`https://wa.me/${WA_NUMBER}?text=${buildWaMessage(formData)}`, '_blank');
    showToast('Pesanan tersimpan & mengarahkan ke WhatsApp...');
    form.reset();
  }

  function showToast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  function initNav() {
    const burger = document.getElementById('burger');
    const links = document.getElementById('navLinks');
    if (!burger || !links) return;
    burger.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // ---------- Auth ----------
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
      let av = btn.querySelector('.user-avatar');
      if (currentUser.picture) {
        if (!av) { av = document.createElement('img'); av.className = 'user-avatar'; av.alt = ''; btn.insertBefore(av, text); }
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
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      currentUser = {
        email: payload.email, name: payload.name, picture: payload.picture,
        isAdmin: isAdminEmail(payload.email)
      };
      sessionStorage.setItem('myrep_user', JSON.stringify(currentUser));
      updateAuthUI();
      showToast(currentUser.isAdmin ? 'Login admin berhasil' : 'Login berhasil');
      if (currentUser.isAdmin) window.location.href = 'admin/';
    } catch (err) {
      console.error(err);
      showToast('Login gagal');
    }
  }

  function initGoogleAuth() {
    const btn = document.getElementById('authBtn');
    if (!btn) return;
    try {
      const saved = sessionStorage.getItem('myrep_user');
      if (saved) { currentUser = JSON.parse(saved); updateAuthUI(); }
    } catch {}
    btn.addEventListener('click', () => {
      if (currentUser) {
        if (currentUser.isAdmin) { window.location.href = 'admin/'; return; }
        currentUser = null;
        sessionStorage.removeItem('myrep_user');
        updateAuthUI();
        showToast('Logout berhasil');
        return;
      }
      if (GOOGLE_CLIENT_ID && window.google && google.accounts) {
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
        google.accounts.id.prompt();
      } else {
        const email = prompt('Demo Login — masukkan email Google Anda:\n(admin@silverhawk.web.id atau ted834r@gmail.com untuk akses admin)');
        if (!email) return;
        currentUser = {
          email: email.trim(), name: email.split('@')[0], picture: null,
          isAdmin: isAdminEmail(email)
        };
        sessionStorage.setItem('myrep_user', JSON.stringify(currentUser));
        updateAuthUI();
        showToast(currentUser.isAdmin ? 'Login admin (demo) berhasil' : 'Login (demo) berhasil');
        if (currentUser.isAdmin) window.location.href = 'admin/';
      }
    });
  }

  // ---------- Speed Test ----------
  function initSpeedTest() {
    const btn = document.getElementById('stStartBtn');
    if (!btn) return;
    const elVal = document.getElementById('stValue');
    const elLabel = document.getElementById('stLabel');
    const elDown = document.getElementById('stDown');
    const elUp = document.getElementById('stUp');
    const elPing = document.getElementById('stPing');
    const progress = document.getElementById('stProgress');
    const barFill = document.getElementById('stBarFill');
    const progressText = document.getElementById('stProgressText');

    const PING_URL = 'https://www.cloudflare.com/cdn-cgi/trace';
    const DL_URLS = [
      'https://speed.cloudflare.com/__down?bytes=1000000',
      'https://speed.cloudflare.com/__down?bytes=5000000',
      'https://speed.cloudflare.com/__down?bytes=10000000'
    ];
    const UL_URL = 'https://speed.cloudflare.com/__up';

    function setProgress(pct, text) {
      barFill.style.width = pct + '%';
      progressText.textContent = text;
    }

    async function measurePing() {
      const samples = [];
      for (let i = 0; i < 4; i++) {
        const t0 = performance.now();
        try {
          await fetch(PING_URL + '?_=' + Date.now(), { cache: 'no-store', mode: 'cors' });
          samples.push(performance.now() - t0);
        } catch { samples.push(999); }
      }
      samples.sort((a, b) => a - b);
      return Math.round(samples[1] || samples[0]);
    }

    async function measureDownload() {
      let best = 0;
      for (let i = 0; i < DL_URLS.length; i++) {
        const t0 = performance.now();
        try {
          const res = await fetch(DL_URLS[i] + '&_=' + Date.now(), { cache: 'no-store', mode: 'cors' });
          const buf = await res.arrayBuffer();
          const ms = performance.now() - t0;
          const mbps = (buf.byteLength * 8 / (ms / 1000)) / 1e6;
          if (mbps > best) best = mbps;
          setProgress(20 + (i + 1) * 20, 'Download… ' + mbps.toFixed(1) + ' Mbps');
          elVal.textContent = mbps.toFixed(1);
        } catch (e) { console.warn(e); }
      }
      return best;
    }

    async function measureUpload() {
      const size = 1 * 1024 * 1024;
      const data = new Uint8Array(size);
      crypto.getRandomValues(data);
      const t0 = performance.now();
      try {
        await fetch(UL_URL, { method: 'POST', body: data, cache: 'no-store', mode: 'cors' });
        const ms = performance.now() - t0;
        return (size * 8 / (ms / 1000)) / 1e6;
      } catch { return 0; }
    }

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      progress.hidden = false;
      elVal.textContent = '…';
      elLabel.textContent = 'Mengukur…';
      elDown.textContent = '— Mbps';
      elUp.textContent = '— Mbps';
      elPing.textContent = '— ms';
      setProgress(5, 'Mengukur ping…');
      try {
        const ping = await measurePing();
        elPing.textContent = ping + ' ms';
        setProgress(15, 'Ping: ' + ping + ' ms');
        elLabel.textContent = 'Download';
        const down = await measureDownload();
        elDown.textContent = down.toFixed(1) + ' Mbps';
        elVal.textContent = down.toFixed(1);
        setProgress(80, 'Mengukur upload…');
        elLabel.textContent = 'Upload';
        const up = await measureUpload();
        elUp.textContent = (up > 0 ? up.toFixed(1) : 'N/A') + ' Mbps';
        setProgress(100, 'Selesai!');
        elLabel.textContent = 'Selesai';
      } catch (err) {
        console.error(err);
        elLabel.textContent = 'Gagal';
        elVal.textContent = '—';
        progressText.textContent = 'Tes gagal. Coba lagi.';
      }
      btn.disabled = false;
      setTimeout(() => { progress.hidden = true; }, 2500);
    });
  }

  // ---------- Visitor Stats (localStorage + session presence) ----------
  function initVisitorStats() {
    const KEY = 'myrep_stats_v1';
    const ONLINE_KEY = 'myrep_online';
    const SESSION_ID = sessionStorage.getItem('myrep_sid') || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    sessionStorage.setItem('myrep_sid', SESSION_ID);

    function today() {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function weekKey() {
      const d = new Date();
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
      return d.getFullYear() + '-W' + week;
    }
    function monthKey() {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    let stats;
    try { stats = JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { stats = {}; }

    const t = today(), w = weekKey(), m = monthKey();
    // Reset counters if period changed
    if (stats.dayKey !== t) { stats.day = 0; stats.dayKey = t; }
    if (stats.weekKey !== w) { stats.week = 0; stats.weekKey = w; }
    if (stats.monthKey !== m) { stats.month = 0; stats.monthKey = m; }

    // Count unique visit per day for this browser
    const visitKey = 'visited_' + t;
    if (!sessionStorage.getItem(visitKey)) {
      stats.day = (stats.day || 0) + 1;
      stats.week = (stats.week || 0) + 1;
      stats.month = (stats.month || 0) + 1;
      sessionStorage.setItem(visitKey, '1');
      localStorage.setItem(KEY, JSON.stringify(stats));
    }

    // Online presence via localStorage heartbeat
    function heartbeat() {
      let online = {};
      try { online = JSON.parse(localStorage.getItem(ONLINE_KEY) || '{}'); } catch {}
      const now = Date.now();
      // purge stale (>45s)
      Object.keys(online).forEach(id => {
        if (now - online[id] > 45000) delete online[id];
      });
      online[SESSION_ID] = now;
      localStorage.setItem(ONLINE_KEY, JSON.stringify(online));
      const count = Object.keys(online).length;
      const el = document.getElementById('fsOnline');
      if (el) el.textContent = count;
    }

    function renderStats() {
      const d = document.getElementById('fsDay');
      const wEl = document.getElementById('fsWeek');
      const mEl = document.getElementById('fsMonth');
      if (d) d.textContent = stats.day || 0;
      if (wEl) wEl.textContent = stats.week || 0;
      if (mEl) mEl.textContent = stats.month || 0;
    }

    renderStats();
    heartbeat();
    setInterval(heartbeat, 15000);

    // Also try free counter API for global-ish total (optional, non-blocking)
    try {
      fetch('https://api.counterapi.dev/v1/myrep-silverhawk/visits/up', { mode: 'cors' })
        .then(r => r.json())
        .then(data => {
          if (data && data.count) {
            // keep local period stats; API is bonus total
          }
        })
        .catch(() => {});
    } catch {}
  }

  // ---------- Auto-scroll when idle 5 seconds ----------
  function initAutoScroll() {
    let idleTimer = null;
    let scrolling = false;
    let rafId = null;
    const IDLE_MS = 5000;
    const SPEED = 1.2; // px per frame (~72px/s at 60fps) — wajar

    function stopScroll() {
      scrolling = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function startScroll() {
      if (scrolling) return;
      scrolling = true;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      function step() {
        if (!scrolling) return;
        const y = window.scrollY || window.pageYOffset;
        if (y >= maxY - 2) {
          // sampai bawah → pause sebentar lalu naik ke atas
          stopScroll();
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // restart idle cycle after returning to top
            resetIdle();
          }, 1800);
          return;
        }
        window.scrollBy(0, SPEED);
        rafId = requestAnimationFrame(step);
      }
      rafId = requestAnimationFrame(step);
    }

    function resetIdle() {
      stopScroll();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(startScroll, IDLE_MS);
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    // Use passive; on scroll only reset if user-initiated (not our auto-scroll)
    let userScrolling = false;
    events.forEach(evt => {
      window.addEventListener(evt, () => {
        if (evt === 'scroll' && scrolling) return; // ignore our own scroll
        resetIdle();
      }, { passive: true });
    });

    resetIdle();
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initNav();
    initGoogleAuth();
    initSpeedTest();
    initVisitorStats();
    initAutoScroll();
    const form = document.getElementById('orderForm');
    if (form) form.addEventListener('submit', handleSubmit);
  });
})();
