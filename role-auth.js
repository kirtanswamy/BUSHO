/* Demo-only role gate. This is intentionally not production authentication. */
(() => {
  const main = document.querySelector('[data-portal-role]');
  if (!main) return;
  const role = main.dataset.portalRole;
  const credentials = {
    worker: { email: 'worker@busho.demo', password: 'worker123' },
    supervisor: { email: 'supervisor@busho.demo', password: 'supervisor123' }
  };
  const login = document.getElementById('portal-login');
  const app = document.getElementById('portal-app');
  const form = document.getElementById('portal-login-form');
  const error = document.getElementById('portal-login-error');
  const sessionKey = `busho-demo-session-${role}`;
  const logout = document.getElementById('portal-logout');

  function enterPortal() {
    login.classList.add('hidden');
    app.classList.remove('hidden');
    app.setAttribute('aria-hidden', 'false');
    sessionStorage.setItem(sessionKey, 'active');
  }
  function leavePortal() {
    sessionStorage.removeItem(sessionKey);
    app.classList.add('hidden');
    app.setAttribute('aria-hidden', 'true');
    login.classList.remove('hidden');
    document.getElementById('portal-username')?.focus();
  }

  if (sessionStorage.getItem(sessionKey) === 'active') enterPortal();
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const expected = credentials[role];
    const email = document.getElementById('portal-username').value.trim().toLowerCase();
    const password = document.getElementById('portal-password').value;
    if (expected && email === expected.email && password === expected.password) {
      error.textContent = '';
      enterPortal();
      document.getElementById('demo-title')?.focus();
    } else {
      error.textContent = 'Those demo credentials do not match this portal. Use the credentials shown below.';
    }
  });
  logout?.addEventListener('click', leavePortal);
})();
