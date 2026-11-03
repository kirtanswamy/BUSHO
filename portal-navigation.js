/* Role-specific portal navigation for the synthetic BUSHO prototype. */
(() => {
  const page = document.querySelector('[data-portal-role]');
  const app = document.getElementById('portal-app');
  if (!page || !app) return;
  const role = page.dataset.portalRole;
  const buttons = [...app.querySelectorAll('[data-portal-view]')];
  const modules = [...app.querySelectorAll('[data-module]')];
  const valid = new Set(buttons.map(button => button.dataset.portalView));

  function activate(view) {
    if (!valid.has(view)) return;
    buttons.forEach(button => {
      const active = button.dataset.portalView === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    modules.forEach(module => {
      const key = module.dataset.module;
      const active = key === view || (role === 'supervisor' && view === 'overview' && key === 'overview-content');
      module.classList.toggle('active', active);
      module.hidden = !active;
    });
    const heading = app.querySelector(`[data-module="${view}"] h2`);
    if (heading) heading.setAttribute('tabindex', '-1');
  }

  buttons.forEach(button => button.addEventListener('click', () => activate(button.dataset.portalView)));
  app.querySelectorAll('[data-go-view]').forEach(button => button.addEventListener('click', () => activate(button.dataset.goView)));

  // Worker report workflow remains the original extraction and confirmation experience.
  // Supervisor overview retains its existing dashboard and approval controls.
  activate('overview');

  const logout = document.getElementById('portal-logout');
  logout?.addEventListener('click', () => {
    buttons.forEach(button => button.classList.remove('active'));
  });
})();
