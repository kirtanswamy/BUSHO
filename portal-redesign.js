/* BUSHO portal polish: navigation and account presentation only.
   Operational metrics and records must come from authenticated Supabase queries. */
(() => {
  const app = document.getElementById('portal-app');
  if (!app) return;
  const page = document.querySelector('[data-portal-role]');
  const role = page?.dataset.portalRole || '';
  const header = document.querySelector('.topbar');
  const sidebar = app.querySelector('.portal-sidebar');

  // Keep account information compact and consistent across authenticated portals.
  const trigger = document.getElementById('profile-trigger');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
    const dropdown = document.getElementById('profile-dropdown');
    trigger.addEventListener('click', () => {
      const open = trigger.getAttribute('aria-expanded') !== 'true';
      trigger.setAttribute('aria-expanded', String(open));
      if (dropdown) dropdown.hidden = !open;
    });
    document.addEventListener('click', event => {
      if (event.target.closest('#profile-trigger, #profile-dropdown')) return;
      trigger.setAttribute('aria-expanded', 'false');
      if (dropdown) dropdown.hidden = true;
    });
  }

  // Responsive navigation is enabled only where the portal actually has a sidebar.
  if (header && sidebar) {
    sidebar.id = sidebar.id || 'busho-sidebar';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sidebar-toggle sidebar-toggle-mobile';
    toggle.setAttribute('aria-controls', sidebar.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span aria-hidden="true">☰</span><span>Menu</span>';
    header.prepend(toggle);
    const close = () => {
      app.classList.remove('sidebar-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = !app.classList.contains('sidebar-open');
      app.classList.toggle('sidebar-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    sidebar.querySelectorAll('[data-portal-view]').forEach(button => button.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  }

  // Ensure role labels remain truthful; do not inject sample records or synthetic
  // metrics into authenticated operational views.
  const roleLabel = { worker: 'Health worker', supervisor: 'Supervisor', storekeeper: 'Storekeeper' }[role];
  if (roleLabel) {
    document.querySelectorAll('[data-profile-role]').forEach(node => { node.textContent = roleLabel; });
  }
})();
