/* =========================================================
   MyRepublic Promo — app.js
========================================================= */
(function () {
  'use strict';

  const WA_NUMBER = '6285159922358'; // Teddy Mulyana
  const APPS_SCRIPT_URL = ''; // Isi setelah deploy Google Apps Script (opsional)

  let packages = [];
  let contact = {};

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

    // 1. Optional: kirim ke Google Apps Script / database
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

    // 2. Buka WhatsApp
    const msg = buildWaMessage(formData);
    const url = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    window.open(url, '_blank');

    showToast('Mengarahkan ke WhatsApp...');
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

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initNav();
    const form = document.getElementById('orderForm');
    if (form) form.addEventListener('submit', handleSubmit);
  });
})();
