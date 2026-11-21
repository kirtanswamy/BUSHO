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
      const client = window.BUSHO_AUTH_CLIENT || clientFactory.createClient(config);
      controller = window.BUSHO_SUPERVISOR_OPERATIONS.createController({
        client,
        document,
        role: profile.role,
        profile
      });
      const activeController=controller; activeController.start({deferLoad:true}); window.setTimeout(()=>{if(controller!==activeController)return;activeController.load().then(()=>{const row=activeController.getState().reports.find(item=>item.facilities?.name);if(row?.facilities?.name)document.dispatchEvent(new CustomEvent('busho:supervisor-facility-context',{detail:{facilityName:row.facilities.name}}));}).catch(cause=>{const overview=document.querySelector('[data-module="overview"]');if(overview)overview.innerHTML='<div class="module-heading"><div><p class="section-kicker">SUPERVISOR WORKSPACE</p><h2>Workspace could not finish loading</h2><p class="portal-login-error" role="alert">'+window.BUSHO_SUPERVISOR_OPERATIONS.escapeHtml(cause?.message||'Please refresh and try again.')+'</p><button type="button" class="btn btn-primary" id="supervisor-retry-load">Retry loading</button></div></div>';document.getElementById('supervisor-retry-load')?.addEventListener('click',()=>activeController.load());});},0);
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
