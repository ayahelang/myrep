(function () {
  const PASS = 'myrep2026'; // ganti sesuai kebutuhan
  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const passInput = document.getElementById('adminPass');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  function checkAuth() {
    if (sessionStorage.getItem('myrep_admin') === '1') {
      loginScreen.classList.add('hidden');
      dashboard.classList.remove('hidden');
    }
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
    location.reload();
  });

  checkAuth();
})();
