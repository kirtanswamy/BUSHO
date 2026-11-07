(() => {
  const form = document.getElementById('setup-form');
  const status = document.getElementById('setup-status');
  const submit = document.getElementById('setup-submit');
  const password = document.getElementById('new-password');
  const confirmation = document.getElementById('confirm-password');
  const clientFactory = window.BUSHO_SUPABASE_CLIENT;
  const config = window.BUSHO_SUPABASE_CONFIG;
  let client = null;
  let verified = false;

  function show(message, type) {
    status.textContent = message;
    status.className = 'setup-status' + (type ? ' ' + type : '');
  }

  async function initialise() {
    try {
      if (!clientFactory || !config) throw new Error('BUSHO secure authentication is not configured.');
      client = clientFactory.createClient(config);
      await client.setSessionFromUrlHash(window.location.hash);
      window.history.replaceState(null, document.title, window.location.pathname);
      verified = true;
      form.classList.remove('hidden');
      show('Invitation verified. Set a password of at least 12 characters.', 'success');
      password.focus();
    } catch (error) {
      show(error.message || 'This invitation link is invalid or expired. Ask an administrator to send a new invitation.', 'error');
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!verified || !client) return;
    if (password.value.length < 12) return show('Use at least 12 characters for your password.', 'error');
    if (password.value !== confirmation.value) return show('The two passwords do not match.', 'error');
    submit.disabled = true;
    show('Saving your password securely…');
    try {
      await client.updatePassword(password.value);
      password.value = '';
      confirmation.value = '';
      const profile = await client.getMyProfile();
      if (!profile || profile.status !== 'active') {
        show('Your password is set, but your BUSHO account is awaiting administrator activation. Contact your administrator.', 'success');
        return;
      }
      show('Password saved. Opening your authorised BUSHO workspace…', 'success');
      const destination = profile.role === 'worker' ? 'worker.html' : 'supervisor.html';
      window.location.assign(destination);
    } catch (error) {
      show(error.message || 'Password could not be saved. Please try again.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  initialise();
})();
