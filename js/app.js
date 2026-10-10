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

    // Cloudflare public speedtest endpoints (CORS-enabled, free)
    const CF_DOWN = 'https://speed.cloudflare.com/__down?bytes=';
    const CF_UP = 'https://speed.cloudflare.com/__up';
    const PING_URL = 'https://speed.cloudflare.com/__down?bytes=0';
    const DL_SIZES = [2000000, 5000000, 10000000]; // 2MB, 5MB, 10MB
    const UL_SIZES = [1000000, 3000000, 5000000]; // 1MB, 3MB, 5MB

    function setProgress(pct, text) {
      barFill.style.width = pct + '%';
      progressText.textContent = text;
    }

    function setNeedle(mbps) {
      const needleG = document.getElementById('stNeedleG');
      const arc = document.getElementById('stArc');
      // Map 0–200 Mbps → -90deg … +90deg (SVG group rotates around pivot)
      const clamped = Math.max(0, Math.min(200, Number(mbps) || 0));
      const deg = -90 + (clamped / 200) * 180;
      if (needleG) {
        needleG.setAttribute('transform', 'translate(100,100) rotate(' + deg + ')');
      }
      if (arc) {
        const pct = (clamped / 200) * 100;
        arc.setAttribute('stroke-dasharray', pct + ' 100');
      }
    }

    // Expand / collapse floating panel
    const stFloat = document.getElementById('stFloat');
    const stToggle = document.getElementById('stFloatToggle');
    const stClose = document.getElementById('stFloatClose');
    let collapseTimer = null;

    function openSt() {
      if (!stFloat) return;
      stFloat.classList.add('open');
      clearTimeout(collapseTimer);
    }
    function closeSt() {
      if (!stFloat) return;
      stFloat.classList.remove('open');
      clearTimeout(collapseTimer);
    }
    function scheduleCollapse() {
      clearTimeout(collapseTimer);
      collapseTimer = setTimeout(closeSt, 15000);
    }

    if (stToggle) stToggle.addEventListener('click', (e) => { e.stopPropagation(); openSt(); });
    if (stClose) stClose.addEventListener('click', (e) => { e.stopPropagation(); closeSt(); });
    // Keep open while interacting inside panel
    const panel = document.getElementById('stFloatPanel');
    if (panel) {
      panel.addEventListener('mousemove', () => clearTimeout(collapseTimer));
      panel.addEventListener('touchstart', () => clearTimeout(collapseTimer), { passive: true });
    }


    function xhrGet(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
          else reject(new Error('HTTP ' + xhr.status));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send();
      });
    }

    function xhrPost(url, body, onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        if (onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(e.loaded, e.total);
          };
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error('HTTP ' + xhr.status));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(body);
      });
    }

    async function measurePing() {
      const samples = [];
      for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        try {
          await xhrGet(PING_URL + '&tid=' + Math.random());
          samples.push(performance.now() - t0);
        } catch {
          samples.push(999);
        }
      }
      samples.sort((a, b) => a - b);
      return Math.round(samples[Math.floor(samples.length / 2)]);
    }

    async function measureDownload() {
      let best = 0;
      for (let i = 0; i < DL_SIZES.length; i++) {
        const size = DL_SIZES[i];
        const t0 = performance.now();
        try {
          const buf = await xhrGet(CF_DOWN + size + '&tid=' + Math.random());
          const ms = performance.now() - t0;
          const bytes = buf.byteLength || size;
          const mbps = (bytes * 8 / (ms / 1000)) / 1e6;
          if (mbps > best) best = mbps;
          setProgress(15 + (i + 1) * 18, 'Download… ' + mbps.toFixed(1) + ' Mbps');
          elVal.textContent = mbps.toFixed(1);
          setNeedle(mbps);
        } catch (e) {
          console.warn('DL fail', e);
        }
      }
      return best;
    }

    async function measureUpload() {
      // Use XHR (not fetch) — required for reliable upload measurement + progress
      let best = 0;
      for (let i = 0; i < UL_SIZES.length; i++) {
        const size = UL_SIZES[i];
        // Random-ish payload so compression doesn't skew results
        const payload = new Uint8Array(size);
        for (let j = 0; j < size; j += 4096) {
          payload[j] = (Math.random() * 256) | 0;
        }
        const t0 = performance.now();
        try {
          await xhrPost(CF_UP + '?tid=' + Math.random(), payload, (loaded) => {
            const elapsed = (performance.now() - t0) / 1000;
            if (elapsed > 0.05) {
              const live = (loaded * 8 / elapsed) / 1e6;
              elVal.textContent = live.toFixed(1);
              setNeedle(live);
              setProgress(70 + (i + 1) * 8, 'Upload… ' + live.toFixed(1) + ' Mbps');
            }
          });
          const ms = performance.now() - t0;
          const mbps = (size * 8 / (ms / 1000)) / 1e6;
          if (mbps > best) best = mbps;
          setProgress(70 + (i + 1) * 8, 'Upload… ' + mbps.toFixed(1) + ' Mbps');
          elVal.textContent = mbps.toFixed(1);
          setNeedle(mbps);
        } catch (e) {
          console.warn('UL fail', e);
        }
      }
      return best;
    }

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      progress.hidden = false;
      openSt();
      clearTimeout(collapseTimer);
      elVal.textContent = '…';
      setNeedle(0);
      elLabel.textContent = 'Mengukur…';
      elDown.textContent = '— Mbps';
      elUp.textContent = '— Mbps';
      elPing.textContent = '— ms';
      setProgress(5, 'Mengukur ping…');
      try {
        const ping = await measurePing();
        elPing.textContent = ping + ' ms';
        setProgress(12, 'Ping: ' + ping + ' ms');

        elLabel.textContent = 'Download';
        const down = await measureDownload();
        elDown.textContent = down.toFixed(1) + ' Mbps';
        elVal.textContent = down.toFixed(1);
        setProgress(68, 'Mengukur upload…');

        elLabel.textContent = 'Upload';
        const up = await measureUpload();
        elUp.textContent = (up > 0 ? up.toFixed(1) : 'N/A') + ' Mbps';
        if (up > 0) elVal.textContent = up.toFixed(1);

        setProgress(100, 'Selesai!');
        elLabel.textContent = 'Selesai';
        elVal.textContent = down.toFixed(1);
        setNeedle(down);
        scheduleCollapse();
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
    const KEY = 'myrep_stats_v2';
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
    function yearKey() {
      return String(new Date().getFullYear());
    }

    let stats;
    try { stats = JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { stats = {}; }

    // Migrate from v1 if present
    try {
      const old = JSON.parse(localStorage.getItem('myrep_stats_v1') || 'null');
      if (old && !stats.total) {
        stats.day = Math.max(stats.day || 0, old.day || 0);
        stats.week = Math.max(stats.week || 0, old.week || 0);
        stats.month = Math.max(stats.month || 0, old.month || 0);
        stats.year = Math.max(stats.year || 0, old.year || 0, old.month || 0, old.week || 0, old.day || 0);
        stats.total = Math.max(stats.total || 0, old.year || 0, old.month || 0, old.week || 0, old.day || 0);
        stats.dayKey = old.dayKey || stats.dayKey;
        stats.weekKey = old.weekKey || stats.weekKey;
        stats.monthKey = old.monthKey || stats.monthKey;
        stats.yearKey = old.yearKey || stats.yearKey;
      }
    } catch {}

    const t = today(), w = weekKey(), m = monthKey(), y = yearKey();
    if (stats.dayKey !== t) { stats.day = 0; stats.dayKey = t; }
    if (stats.weekKey !== w) { stats.week = 0; stats.weekKey = w; }
    if (stats.monthKey !== m) { stats.month = 0; stats.monthKey = m; }
    if (stats.yearKey !== y) { stats.year = 0; stats.yearKey = y; }

    // Ensure hierarchy: total >= year >= month >= week >= day
    stats.total = stats.total || 0;
    stats.year = Math.max(stats.year || 0, stats.month || 0, stats.week || 0, stats.day || 0);
    stats.total = Math.max(stats.total, stats.year);

    const visitKey = 'visited_' + t;
    if (!sessionStorage.getItem(visitKey)) {
      stats.day = (stats.day || 0) + 1;
      stats.week = (stats.week || 0) + 1;
      stats.month = (stats.month || 0) + 1;
      stats.year = (stats.year || 0) + 1;
      stats.total = (stats.total || 0) + 1;
      // keep hierarchy
      stats.year = Math.max(stats.year, stats.month);
      stats.total = Math.max(stats.total, stats.year);
      sessionStorage.setItem(visitKey, '1');
      localStorage.setItem(KEY, JSON.stringify(stats));
    } else {
      // Still persist hierarchy fixes
      localStorage.setItem(KEY, JSON.stringify(stats));
    }

    function heartbeat() {
      let online = {};
      try { online = JSON.parse(localStorage.getItem(ONLINE_KEY) || '{}'); } catch {}
      const now = Date.now();
      Object.keys(online).forEach(id => {
        if (now - online[id] > 45000) delete online[id];
      });
      online[SESSION_ID] = now;
      localStorage.setItem(ONLINE_KEY, JSON.stringify(online));
      const el = document.getElementById('fsOnline');
      if (el) el.textContent = Object.keys(online).length;
    }

    function renderStats() {
      const map = {
        fsDay: stats.day || 0,
        fsWeek: stats.week || 0,
        fsMonth: stats.month || 0,
        fsYear: stats.year || 0,
        fsTotal: stats.total || 0
      };
      Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = map[id];
      });
    }

    renderStats();
    heartbeat();
    setInterval(heartbeat, 15000);
  }

  // ---------- Auto-scroll: default idle 15–30s random; aggressive mode 5s ----------
  function initAutoScroll() {
    let idleTimer = null;
    let scrolling = false;
    let rafId = null;
    let aggressive = false; // true = idle 5s, false = 15–30s random
    const SPEED = 1.2;
    const AGGRESSIVE_IDLE = 5000;

    function randomIdle() {
      return 15000 + Math.floor(Math.random() * 15001); // 15–30s
    }

    function currentIdle() {
      return aggressive ? AGGRESSIVE_IDLE : randomIdle();
    }

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
          stopScroll();
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
      idleTimer = setTimeout(startScroll, currentIdle());
    }

    // Floating toggle button
    const toggleBtn = document.getElementById('autoScrollToggle');
    function updateToggleUI() {
      if (!toggleBtn) return;
      toggleBtn.classList.toggle('active', aggressive);
      toggleBtn.setAttribute('aria-pressed', aggressive ? 'true' : 'false');
      toggleBtn.title = aggressive
        ? 'Auto-scroll agresif ON (idle 5 dtk) — klik untuk matikan'
        : 'Auto-scroll normal (idle 15–30 dtk) — klik untuk mode agresif 5 dtk';
      const label = toggleBtn.querySelector('.ast-label');
      if (label) label.textContent = aggressive ? 'Auto 5s ON' : 'Auto scroll';
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        aggressive = !aggressive;
        updateToggleUI();
        resetIdle();
      });
      updateToggleUI();
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    events.forEach(evt => {
      window.addEventListener(evt, () => {
        if (evt === 'scroll' && scrolling) return;
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
