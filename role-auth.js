/* BUSHO Auth gate. Portal access is derived from Supabase Auth + the server-controlled profiles row. */
(() => {
  const page = document.querySelector('[data-portal-role]');
  if (!page) return;

  const portalKind = page.dataset.portalRole;
  const allowedRoles = portalKind === 'worker'
    ? ['worker']
    : ['supervisor', 'district_admin', 'state_admin'];

  const login = document.getElementById('portal-login');
  const app = document.getElementById('portal-app');
  const form = document.getElementById('portal-login-form');
  const emailInput = document.getElementById('portal-username');
  const passwordInput = document.getElementById('portal-password');
  const error = document.getElementById('portal-login-error');
  const logout = document.getElementById('portal-logout');
  const submit = form?.querySelector('[type="submit"]');
  const sessionLabel = document.querySelector('.portal-session-bar span');

  const policy = window.BUSHO_PORTAL_AUTH_POLICY;
  const clientFactory = window.BUSHO_SUPABASE_CLIENT;
  const config = window.BUSHO_SUPABASE_CONFIG;

  let authClient = null;
  try {
    if (clientFactory && config) authClient = clientFactory.createClient(config);
  } catch (cause) {
    showError(cause.message || 'Secure sign-in is not configured for this environment.');
  }

  function showError(message) {
    if (error) error.textContent = String(message || 'Unable to sign in. Please try again.');
  }

  function setBusy(busy) {
    if (!submit) return;
    submit.disabled = Boolean(busy);
    submit.setAttribute('aria-busy', String(Boolean(busy)));
    if (!submit.dataset.defaultLabel) submit.dataset.defaultLabel = submit.textContent.trim();
    submit.textContent = busy ? 'Signing in…' : submit.dataset.defaultLabel;
  }

  function enterPortal(profile) {
    if (login) login.classList.add('hidden');
    if (app) {
      app.classList.remove('hidden');
      app.setAttribute('aria-hidden', 'false');
    }
    if (sessionLabel) {
      const label = portalKind === 'worker' ? 'Health worker workspace' : 'Operations workspace';
      sessionLabel.textContent = profile.display_name
        ? 'Signed in as ' + profile.display_name + ' · ' + label
        : 'Signed in · ' + label;
    }
    document.getElementById('demo-title')?.focus();
    document.dispatchEvent(new CustomEvent('busho:authenticated', { detail: { profile } }));
  }

  function showLogin() {
    if (app) {
      app.classList.add('hidden');
      app.setAttribute('aria-hidden', 'true');
    }
    if (login) login.classList.remove('hidden');
    emailInput?.focus();
    document.dispatchEvent(new CustomEvent('busho:unauthenticated'));
  }

  function accessMessage(reason) {
    if (reason === 'profile_missing') {
      return 'This account is not linked to a BUSHO profile yet. Ask the BUSHO administrator to provision your role and facility assignment.';
    }
    if (reason === 'account_not_active') {
      return 'Your BUSHO account is awaiting administrator approval. You cannot access operational records yet.';
    }
    return portalKind === 'worker'
      ? 'This account is not assigned the Health Worker role.'
      : 'This account does not have an authorised operations role.';
  }

  async function validateProfile(profile) {
    const decision = policy?.evaluateProfile(profile, allowedRoles);
    if (!decision) throw new Error('BUSHO security policy is unavailable. Refresh the page or contact the administrator.');
    if (!decision.allowed) throw new Error(accessMessage(decision.reason));
    return profile;
  }

  async function clearSessionAndShowError(message) {
    try { await authClient?.signOut(); } catch {}
    showLogin();
    showError(message);
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!authClient) {
      showError('Secure sign-in is not configured. Check the BUSHO Supabase project configuration.');
      return;
    }
    showError('');
    setBusy(true);
    try {
      const result = await authClient.signInWithPassword({
        email: emailInput?.value,
        password: passwordInput?.value
      });
      const profile = await validateProfile(result?.profile);
      passwordInput.value = '';
      enterPortal(profile);
    } catch (cause) {
      await clearSessionAndShowError(cause.message);
    } finally {
      setBusy(false);
    }
  });

  logout?.addEventListener('click', async () => {
    setBusy(true);
    try { await authClient?.signOut(); }
    finally {
      showError('');
      showLogin();
      setBusy(false);
    }
  });

  async function restoreExistingSession() {
    if (!authClient?.getSession()) return;
    try {
      const profile = await validateProfile(await authClient.getMyProfile());
      enterPortal(profile);
    } catch (cause) {
      await clearSessionAndShowError(cause.message);
    }
  }

  restoreExistingSession();
})();
