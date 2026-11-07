(() => {
  const page = document.querySelector('[data-portal-role="supervisor"]');
  if (!page) return;

  let controller = null;
  let currentUserId = null;

  document.addEventListener('busho:authenticated', event => {
    const profile = event.detail?.profile;
    if (!profile?.id || !['supervisor','district_admin','state_admin'].includes(profile.role)) return;
    currentUserId = profile.id;
    controller?.stop();
    const clientFactory = window.BUSHO_SUPABASE_CLIENT;
    const config = window.BUSHO_SUPABASE_CONFIG;
    if (!clientFactory || !config) {
      const inbox = document.querySelector('[data-module="reports"]');
      if (inbox) inbox.innerHTML = '<p class="portal-login-error">Secure data access is not configured. Contact the BUSHO administrator.</p>';
      return;
    }
    try {
      const client = clientFactory.createClient(config);
      controller = window.BUSHO_SUPERVISOR_OPERATIONS.createController({
        client,
        document,
        role: profile.role,
        profile
      });
      controller.start();
    } catch (cause) {
      const inbox = document.querySelector('[data-module="reports"]');
      if (inbox) inbox.innerHTML = '<p class="portal-login-error">' + window.BUSHO_SUPERVISOR_OPERATIONS.escapeHtml(cause.message) + '</p>';
    }
  });

  document.addEventListener('busho:unauthenticated', () => {
    currentUserId = null;
    controller?.stop();
    controller = null;
  });
})();
