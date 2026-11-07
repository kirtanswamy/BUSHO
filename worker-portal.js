(() => {
  const page = document.querySelector('[data-portal-role="worker"]');
  if (!page) return;

  let controller = null;

  document.addEventListener('busho:authenticated', event => {
    const profile = event.detail?.profile;
    if (!profile?.id || profile.role !== 'worker') return;
    controller?.stop();
    const clientFactory = window.BUSHO_SUPABASE_CLIENT;
    const config = window.BUSHO_SUPABASE_CONFIG;
    if (!clientFactory || !config) {
      const history = document.querySelector('[data-module="my-reports"]');
      if (history) history.innerHTML = '<p class="portal-login-error">Secure report history is not configured. Contact the BUSHO administrator.</p>';
      return;
    }
    try {
      const client = clientFactory.createClient(config);
      controller = window.BUSHO_WORKER_HISTORY.createController({
        client,
        document,
        profile
      });
      controller.start();
    } catch (cause) {
      const history = document.querySelector('[data-module="my-reports"]');
      if (history) history.innerHTML = '<p class="portal-login-error">' + window.BUSHO_WORKER_HISTORY.escapeHtml(cause.message) + '</p>';
    }
  });

  document.addEventListener('busho:unauthenticated', () => {
    controller?.stop();
    controller = null;
  });
})();
