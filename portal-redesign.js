/* BUSHO demo workspace polish: presentation-only enhancements; workflow engine remains untouched. */
(() => {
  const app = document.getElementById('portal-app');
  if (!app) return;
  const role = document.querySelector('[data-portal-role]')?.dataset.portalRole;
  const session = app.querySelector('.portal-session-bar');
  if (session) session.remove();

  // Sidebar navigation: desktop keeps a persistent navy rail with a Menu control;
  // mobile uses a header trigger to open the same drawer.
  const header = app.querySelector('.demo-header');
  const sidebar = app.querySelector('.portal-sidebar');
  if (header && sidebar) {
    sidebar.id = 'busho-sidebar';
    const roleBrand = sidebar.querySelector('.sidebar-brand');
    if (roleBrand) roleBrand.remove();
    const sidebarTop = document.createElement('div');
    sidebarTop.className = 'sidebar-menu-row';
    const desktopToggle = document.createElement('button');
    desktopToggle.type = 'button'; desktopToggle.className = 'sidebar-toggle sidebar-toggle-inside';
    desktopToggle.innerHTML = '<span aria-hidden="true">☰</span><span>Menu</span>';
    sidebarTop.append(desktopToggle); sidebar.prepend(sidebarTop);
    const mobileToggle = document.createElement('button');
    mobileToggle.type = 'button'; mobileToggle.className = 'sidebar-toggle sidebar-toggle-mobile';
    mobileToggle.setAttribute('aria-controls','busho-sidebar'); mobileToggle.setAttribute('aria-expanded','false');
    mobileToggle.innerHTML = '<span aria-hidden="true">☰</span><span>Menu</span>'; header.prepend(mobileToggle);
    const backdrop = document.createElement('button');
    backdrop.type = 'button'; backdrop.className = 'sidebar-backdrop';
    backdrop.setAttribute('aria-label','Close navigation'); app.append(backdrop);
    const isMobile = () => window.matchMedia('(max-width:760px)').matches;
    const closeMobile = () => { app.classList.remove('sidebar-open'); mobileToggle.setAttribute('aria-expanded','false'); };
    desktopToggle.addEventListener('click', () => {
      if (!isMobile()) app.classList.toggle('sidebar-collapsed');
    });
    mobileToggle.addEventListener('click', () => {
      app.classList.toggle('sidebar-open');
      mobileToggle.setAttribute('aria-expanded',String(app.classList.contains('sidebar-open')));
    });
    backdrop.addEventListener('click',closeMobile);
    sidebar.querySelectorAll('[data-portal-view]').forEach(btn=>btn.addEventListener('click',()=>{if(isMobile())closeMobile();}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobile();});
    window.addEventListener('resize',()=>{if(!isMobile())closeMobile();});
  }

  // Keep the active block visible and let the supervisor explore fictional datasets.
  if (role === 'supervisor') {
    const scope = app.querySelector('[data-module="overview"] .module-heading');
    const blockOptions = [
      ['Rampur block · Chhattisgarh','Rampur'], ['Dhamtari block · Chhattisgarh','Dhamtari'],
      ['Kanker block · Chhattisgarh','Kanker'], ['Bilaspur block · Chhattisgarh','Bilaspur'],
      ['Barabanki block · Uttar Pradesh','Barabanki'], ['Sadar block · Uttar Pradesh','Sadar']
    ];
    const select = document.createElement('select'); select.className = 'demo-block-select'; select.setAttribute('aria-label','Select synthetic demo block');
    blockOptions.forEach(([label,value]) => { const option=document.createElement('option'); option.value=value; option.textContent=label; select.append(option); });
    const scopeLabel = scope?.querySelector('.scope-label'); if (scopeLabel) { scopeLabel.replaceWith(select); }
    const facilityNames = {Rampur:['Rampur HWC','Rampur Sub-centre'],Dhamtari:['Dhamtari HWC','Kurud HWC'],Kanker:['Kanker HWC','Charama HWC'],Bilaspur:['Bilaspur HWC','Masturi HWC'],Barabanki:['Barabanki HWC','Haidergarh HWC'],Sadar:['Sadar HWC','Nawabganj HWC']};
    const people = ['Anita Verma','Suresh Patel','Meena Sahu','Ravi Kumar','Pooja Yadav','Amit Netam'];
    const updateScope = () => {
      const block=select.value, facilities=facilityNames[block] || facilityNames.Rampur;
      const context=app.querySelector('.demo-context');
      if(context){ const loc=context.querySelector('[data-i18n="ui.location"]'); if(loc) loc.textContent=`${block} block / Synthetic demo data`; const name=context.querySelector('[data-i18n="ui.facility"]'); if(name) name.textContent=facilities[0]; }
      app.querySelectorAll('[data-module="overview"] .facility-progress-head strong, [data-module="overview"] .inventory-watch-row small').forEach((el,i)=>{ if(i<2) el.textContent=facilities[i%2]; });
      const facilityTable=app.querySelector('[data-module="facilities"] .simple-table');
      if(facilityTable){ const rows=facilityTable.querySelectorAll('.simple-row:not(.simple-header)'); rows.forEach((row,i)=>{ if(row.children[0]) row.children[0].textContent=facilities[i%2]; }); }
      const workersTable=app.querySelector('[data-module="workers"] .simple-table');
      if(workersTable){ const rows=workersTable.querySelectorAll('.simple-row:not(.simple-header)'); rows.forEach((row,i)=>{ row.children[0].textContent=people[(i+(blockOptions.findIndex(x=>x[1]===block)))%people.length]; row.children[1].textContent=facilities[i%2]; }); }
      const greet=app.querySelector('[data-module="overview"] .module-heading h2'); if(greet) greet.textContent=`Good afternoon, Supervisor · ${block}`;
    };
    select.addEventListener('change',updateScope); updateScope();

    // Put the high-value draft approval action in the report workflow, not at the
    // bottom of the overview dashboard.
    const adminResponse = app.querySelector('#admin-response');
    const reportsModule = app.querySelector('[data-module="reports"]');
    if (adminResponse && reportsModule) {
      adminResponse.classList.add('admin-response-inbox');
      reportsModule.prepend(adminResponse);
    }

    // Rebuild the two overview insight cards around legible comparisons and clear
    // decision signals rather than the cramped legacy chart/inline meter labels.
    const trendCard=app.querySelector('.trend-card');
    if(trendCard){
      const chart=trendCard.querySelector('.chart-container');
      if(chart) chart.innerHTML=`<div class="signal-comparison"><div class="signal-period"><span>Previous 7 days</span><strong>23</strong><small>reported mentions</small></div><div class="signal-arrow" aria-hidden="true">→</div><div class="signal-period signal-current"><span>Current 7 days</span><strong>32</strong><small>reported mentions</small></div></div><div class="signal-sparkline" role="img" aria-label="Synthetic daily fever mention counts: 3, 4, 3, 5, 5, 6, 6"><span style="height:38%"></span><span style="height:52%"></span><span style="height:38%"></span><span style="height:66%"></span><span style="height:66%"></span><span style="height:82%"></span><span style="height:82%"></span></div><div class="signal-day-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div class="chart-summary"><p>Reported mentions are up 38% in this synthetic dataset. Treat this as a prompt for verification, not evidence of an outbreak or diagnosis.</p></div>`;
    }
    const inventoryCard=app.querySelector('.inventory-card');
    if(inventoryCard){
      inventoryCard.querySelectorAll('.inventory-row').forEach(row=>{
        const meter=row.querySelector('.stock-meter'), label=meter?.querySelector('.meter-label b');
        const value=meter?.querySelector('.meter-label span')?.textContent||'';
        const match=value.match(/(\d+)\s*\/\s*(\d+)/);
        if(meter && match){
          const pct=Math.round(Number(match[1])/Number(match[2])*100);
          meter.innerHTML=`<div class="stock-meter-head"><span>${value} available</span><strong>${pct}%</strong></div><div class="meter"><i style="width:${pct}%"></i></div>`;
          row.dataset.stockPercent=String(pct);
        }
      });
    }
    const activityCard=app.querySelector('[data-module="activity"] .module-card');
    if(activityCard){
      activityCard.innerHTML=`<div class="activity-toolbar"><div><strong>Recent system events</strong><small>Browser-local demo activity · newest first</small></div><span class="activity-live-dot">DEMO LOG</span></div><div class="activity-timeline"><article class="activity-event"><span class="activity-event-icon report">↗</span><div><strong>Field report confirmed</strong><p>A health worker confirmed a routine field report.</p><small>Today · 10:42 AM <b>Reports</b></small></div><span class="activity-status done">Recorded</span></article><article class="activity-event"><span class="activity-event-icon stock">!</span><div><strong>Inventory signal flagged</strong><p>ORS packets fell below the illustrative threshold.</p><small>Yesterday <b>Inventory</b></small></div><span class="activity-status review">Review</span></article><article class="activity-event"><span class="activity-event-icon system">✓</span><div><strong>Workspace checked</strong><p>Supervisor demo workspace opened successfully.</p><small>Today <b>System</b></small></div><span class="activity-status done">Complete</span></article></div><p class="activity-footnote">This is an illustrative activity feed, not a tamper-proof or server-side audit log.</p>`;
      activityCard.classList.add('activity-log-scroll');
    }

    // Give the secondary operational modules richer, scannable synthetic views.
    const trends=app.querySelector('[data-module="trends"] .module-card');
    if(trends) trends.innerHTML=`<div class="trend-summary-grid"><div class="trend-stat"><span>Fever mentions</span><strong>+38%</strong><small>vs previous synthetic 7 days</small></div><div class="trend-stat"><span>Diarrhoea mentions</span><strong>+14%</strong><small>vs previous synthetic 7 days</small></div><div class="trend-stat"><span>Reports reviewed</span><strong>86%</strong><small>Illustrative review rate</small></div></div><h3 class="subsection-title">Reported signals · last 7 days</h3><div class="trend-bars" role="img" aria-label="Synthetic daily symptom signal counts">${[4,6,5,8,7,11,9].map((v,i)=>`<div><i style="height:${v*8}px"></i><span>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span><b>${v}</b></div>`).join('')}</div><p class="muted-copy">Synthetic reporting signals for human review only. These values do not establish an outbreak, diagnosis or confirmed medical event.</p>`;
    const inventory=app.querySelector('[data-module="inventory"] .simple-table');
    if(inventory){ inventory.classList.add('inventory-table'); inventory.querySelectorAll('.simple-row:not(.simple-header)').forEach(row=>{ const stock=row.children[2]?.textContent.match(/(\d+)\s*\/\s*(\d+)/); if(stock){ const pct=Math.round(Number(stock[1])/Number(stock[2])*100); const meter=document.createElement('div'); meter.className='stock-meter'; meter.innerHTML=`<span style="width:${pct}%"></span>`; row.children[2].append(meter); } }); }
    const activity=app.querySelector('[data-module="activity"] .module-card');
    if(activity) activity.classList.add('activity-log-scroll');
    const settings=app.querySelector('[data-module="settings"] .module-card');
    if(settings) settings.innerHTML=`<div class="settings-grid"><label>Demo workspace name<input value="BUSHO Operations Demo" /></label><label>Default block<select><option>Rampur, Chhattisgarh</option><option>Dhamtari, Chhattisgarh</option><option>Barabanki, Uttar Pradesh</option></select></label><label>Dashboard refresh<select><option>Manual refresh</option><option>Every 5 minutes (demo)</option><option>Every 15 minutes (demo)</option></select></label><label>Notification preference<select><option>In-app alerts</option><option>Priority alerts only</option><option>All demo notifications</option></select></label></div><p class="muted-copy">These preferences are illustrative and affect this browser demo only. No external service or government system is connected.</p><button type="button" class="btn btn-secondary" id="demo-settings-save">Save demo preferences</button><span class="settings-saved" aria-live="polite"></span>`;
    app.querySelector('#demo-settings-save')?.addEventListener('click',()=>{const msg=app.querySelector('.settings-saved'); if(msg) msg.textContent='Demo preferences saved for this session.';});
  }

  if (role === 'worker') {
    const greeting=app.querySelector('[data-module="overview"] .module-heading h2'); if(greeting) greeting.textContent='Good afternoon, Anita Verma';
    const profile=app.querySelector('[data-module="profile"] .module-card');
    if(profile) profile.innerHTML='<div class="profile-summary"><div class="profile-avatar">AV</div><div><h3>Anita Verma</h3><p>Health Worker · Synthetic demo account</p></div><span class="status-pill status-confirmed">Active demo</span></div><div class="profile-details"><div><small>Assigned facility</small><strong>Rampur HWC</strong></div><div><small>Block / District</small><strong>Rampur · Chhattisgarh</strong></div><div><small>Demo worker ID</small><strong>BUSHO-HW-0042</strong></div><div><small>Reporting scope</small><strong>Facility-level updates</strong></div></div><p class="muted-copy">Fictional profile details for product testing. No real worker identity is represented.</p>';
    const facility=app.querySelector('[data-module="facility"] .module-card');
    if(facility) facility.innerHTML='<div class="facility-hero"><span class="facility-icon">⌂</span><div><h3>Rampur Health & Wellness Centre</h3><p>Rampur block · Chhattisgarh</p><span class="status-pill status-confirmed">Synthetic demo facility</span></div></div><div class="profile-details"><div><small>Assigned health worker</small><strong>Anita Verma</strong></div><div><small>Demo reporting period</small><strong>03 Nov 2026</strong></div><div><small>Facility category</small><strong>Health & Wellness Centre</strong></div></div><p class="muted-copy">Facility details are illustrative and do not represent a connected government facility.</p>';
    const pending=app.querySelector('[data-module="pending"] .module-card');
    if(pending) pending.innerHTML='<div class="empty-state-icon">✓</div><h3>You are all caught up</h3><p>No additional reports are waiting for confirmation in this synthetic demo. New extracted drafts will appear here when created.</p><button class="btn btn-primary" data-go-view="new-report">＋ Create a report</button>';
    const intro=app.querySelector('[data-module="new-report"] .panel-intro');
    if(intro){ const h=intro.querySelector('h3'); if(h) h.textContent='Create a field update'; }
  }
})();
