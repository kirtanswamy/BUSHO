/* Shared role-aware portal navigation with keyboard and screen-reader support. */
(() => {
  const page = document.querySelector('[data-portal-role]');
  const app = document.getElementById('portal-app');
  if (!page || !app) return;

  const role = page.dataset.portalRole;
  const buttons = [...app.querySelectorAll('[data-portal-view]')];
  const modules = [...app.querySelectorAll('[data-module]')];
  const moduleByView = new Map(modules.map(module => [module.dataset.module, module]));
  const valid = new Set(buttons.map(button => button.dataset.portalView));

  // Give every workspace panel a stable relationship to its navigation control.
  buttons.forEach(button => {
    const view = button.dataset.portalView;
    const module = moduleByView.get(view);
    if (!module) return;
    if (!module.id) module.id = `busho-${role}-module-${view}`;
    button.setAttribute('aria-controls', module.id);
  });

  function activate(view, { focus = true } = {}) {
    if (!valid.has(view)) return;

    buttons.forEach(button => {
      const active = button.dataset.portalView === view;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    modules.forEach(module => {
      const active = module.dataset.module === view
        || (role === 'supervisor' && view === 'overview' && module.dataset.module === 'overview-content');
      module.classList.toggle('active', active);
      module.hidden = !active;
    });

    const module = moduleByView.get(view);
    const heading = module?.querySelector('h1, h2, h3');
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      if (focus) heading.focus({ preventScroll: true });
    }
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => activate(button.dataset.portalView));
  });

  app.querySelectorAll('[data-go-view]').forEach(button => {
    button.addEventListener('click', () => activate(button.dataset.goView));
  });

  // The worker report workflow remains the original extraction and confirmation
  // experience. The supervisor overview retains its authenticated dashboard.
  activate('overview', { focus: false });

  const logout = document.getElementById('portal-logout');
  logout?.addEventListener('click', () => {
    buttons.forEach(button => {
      button.classList.remove('active');
      button.removeAttribute('aria-current');
    });
  });
})();
