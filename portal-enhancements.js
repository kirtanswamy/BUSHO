/* BUSHO portal interaction and shared synthetic reporting */
(() => {
  const role = document.querySelector('[data-portal-role]')?.dataset.portalRole;
  if (!role) return;
  const safeUI = value => String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));
  const addActivity = (title, detail, category='System', status='Recorded') => {
    const feed=document.querySelector('[data-module=\"activity\"] .activity-timeline');
    if(!feed) return;
    const item=document.createElement('article'); item.className='activity-event';
    const icon=category==='Inventory'?'!':category==='Reports'?'↗':'✓';
    item.innerHTML=`<span class=\"activity-event-icon ${category.toLowerCase()}\">${icon}</span><div><strong>${safeUI(title)}</strong><p>${safeUI(detail)}</p><small>Just now <b>${safeUI(category)}</b></small></div><span class=\"activity-status done\">${safeUI(status)}</span>`;
    feed.prepend(item);
  };
  const trigger = document.getElementById('profile-trigger');
  const menu = document.getElementById('profile-dropdown');
  const closeMenu = () => { if (menu) menu.hidden = true; trigger?.setAttribute('aria-expanded','false'); };
  trigger?.addEventListener('click', (event) => {
    event.stopPropagation();
    menu.hidden = !menu.hidden;
    trigger.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', (event) => { if (menu && !menu.contains(event.target) && !trigger?.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  menu?.querySelectorAll('[data-profile-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.profileAction;
    closeMenu();
    if (action === 'signout') return;
    else if (action === 'facility') document.querySelector(`[data-go-view="${role==='supervisor'?'facilities':'facility'}"]`)?.click();
    else if (action === 'profile') document.querySelector(`[data-go-view="profile"]`)?.click();
    else if (action === 'preferences') document.getElementById('lang-select')?.focus();
  }));

  // The supervisor workspace uses the authenticated database event feed, never the
  // browser-local synthetic cross-role demo bridge.
  if (role === 'supervisor') return;

  // In-app notifications are browser-local and remain available while this browser
  // profile is offline. Cross-tab storage events keep the two demo roles in sync.
  const NOTICE_KEY = 'busho-demo-notifications-v1';
  const readNotices = () => { try { const v=JSON.parse(localStorage.getItem(NOTICE_KEY)||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } };
  const saveNotice = (title, detail, type='info') => {
    const items=readNotices(); items.unshift({id:`${Date.now()}-${Math.random().toString(16).slice(2)}`,title,detail,type,at:new Date().toISOString(),read:false});
    try { localStorage.setItem(NOTICE_KEY,JSON.stringify(items.slice(0,40))); } catch {}
    renderNoticePanel();
  };
  const topbar = document.querySelector('.topbar-right');
  let noticeButton, noticePanel;
  function renderNoticePanel() {
    if (!noticeButton || !noticePanel) return;
    const items=readNotices(), unread=items.filter(n=>!n.read).length;
    noticeButton.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span class="notification-count">${unread}</span>`;
    noticeButton.setAttribute('aria-label',`Notifications, ${unread} unread`);
    noticePanel.innerHTML=`<div class="notification-panel-head"><strong>Notifications</strong><button type="button" data-notice-clear>Mark all read</button></div>${items.length?items.map(n=>`<article class="notification-item ${n.read?'is-read':''}"><b>${safeUI(n.title)}</b><p>${safeUI(n.detail)}</p><small>${new Date(n.at).toLocaleString()}</small></article>`).join(''):'<p class="notification-empty">You are all caught up. New report and inventory updates will appear here.</p>'}`;
    noticePanel.querySelector('[data-notice-clear]')?.addEventListener('click',()=>{const next=readNotices().map(n=>({...n,read:true}));try{localStorage.setItem(NOTICE_KEY,JSON.stringify(next));}catch{}renderNoticePanel();});
  }
  if(topbar){
    const wrap=document.createElement('div'); wrap.className='notification-wrap';
    noticeButton=document.createElement('button'); noticeButton.type='button'; noticeButton.className='notification-trigger';
    noticePanel=document.createElement('section'); noticePanel.className='notification-panel'; noticePanel.hidden=true;
    wrap.append(noticeButton,noticePanel); topbar.prepend(wrap);
    noticeButton.addEventListener('click',()=>{noticePanel.hidden=!noticePanel.hidden;});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target))noticePanel.hidden=true;});
    renderNoticePanel();
  }
  window.addEventListener('storage',event=>{
    if(event.key===NOTICE_KEY) renderNoticePanel();
    if(event.key==='busho-demo-shared-reports-v1'){
      renderNoticePanel();
      if(role==='supervisor'){
        const rows=read(), latest=rows[rows.length-1];
        if(latest) {
          saveNotice('New field report received', `${latest.title} was submitted by a health worker and is ready for review.`, 'info');
          addActivity('New field report received',latest.title,'Reports','Needs review');
          renderSupervisorRecords();
        }
      }
    }
  });

  const STORAGE = 'busho-demo-shared-reports-v1';
  const read = () => { try { const value = JSON.parse(localStorage.getItem(STORAGE)||'[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const write = rows => { try { localStorage.setItem(STORAGE,JSON.stringify(rows.slice(-100))); } catch {} };
  const input = document.getElementById('report-input');
  const extract = document.getElementById('extract-btn');
  const confirm = document.getElementById('confirm-btn');
  const list = document.getElementById('extraction-list');
  const safeDraft = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let currentId = null;
  function parseReport(text) {
    const lower=text.toLowerCase();
    const number=(pattern)=>{const m=text.match(pattern);return m?m[1]:null;};
    const fever=number(/(\d+)\s*(?:patients?\s*)?(?:with\s*)?fever/i);
    const diarr=number(/(\d+)\s*(?:patients?\s*)?(?:with\s*)?diarr?hoea/i) || number(/(\d+)\s*(?:patients?\s*)?(?:with\s*)?diarrhea/i);
    const ors=number(/(\d+)\s*(?:ors\s*)?packets?/i) || number(/ors\s*[:\-]?\s*(\d+)/i);
    const fields=[];
    if(fever) fields.push({label:'Fever mentions',value:`${fever} people mentioned fever`,confidence:'High'});
    if(diarr) fields.push({label:'Diarrhoea mentions',value:`${diarr} people mentioned diarrhoea`,confidence:'High'});
    if(ors) fields.push({label:'ORS stock',value:`${ors} packets`,confidence:'High'});
    if(/iron|folic|ifa/i.test(lower)) fields.push({label:'Iron & folic acid stock',value:/almost|nearly|low|finished/i.test(lower)?'Reported as low / nearly finished':'Mentioned; quantity needs review',confidence:/almost|nearly|low|finished/i.test(lower)?'Review':'Needs review'});
    if(!fields.length) fields.push({label:'Field observation',value:text.slice(0,220),confidence:'Needs review'});
    return fields;
  }
  function renderSupervisorRecords() {
    const rows=read().filter(r=>r.status==='Confirmed');
    const inbox=document.querySelector('[data-module="reports"] .simple-table');
    if(inbox && rows.length) {
      const header=inbox.querySelector('.simple-header')?.outerHTML || '';
      inbox.innerHTML=header+rows.slice().reverse().map(r=>`<div class="simple-row"><span>${safeDraft(r.title)}</span><span>Anita Verma</span><span><b class="status-pill ${r.status==='Confirmed'?'status-confirmed':'status-review'}">${safeDraft(r.status)}</b></span><span>${safeDraft(r.priority||'Review')}</span></div>`).join('');
    }
    const total=document.getElementById('sv-reports-total');
    const pending=document.getElementById('sv-reports-review');
    if(total) total.textContent=String(30+rows.length);
    if(pending) pending.textContent=String(8+rows.filter(r=>r.status!=='Reviewed').length).padStart(2,'0');
  }
  if(role==='worker' && extract && window.BUSHO_ENABLE_SYNTHETIC_REPORT_BRIDGE === true) {
    extract.addEventListener('click', () => {
      const text=input?.value.trim() || '';
      if(!text) return;
      currentId='RPT-'+Date.now().toString().slice(-7);
      const fields=parseReport(text);
      const existing=read().filter(r=>r.id!==currentId);
      const record={id:currentId,title:text.length>56?text.slice(0,53)+'…':text,createdAt:new Date().toISOString(),status:'Draft · awaiting worker confirmation',priority:fields.some(f=>f.confidence!=='High')?'Needs review':'Normal',fields};
      existing.push(record); write(existing);
      // app-v2.js owns extraction and renders the structured clinical review tables. This listener only records a draft for the supervisor bridge.
    });
    confirm?.addEventListener('click',()=> {
      window.setTimeout(()=>{
        const rows=read(); const rec=rows.find(r=>r.id===currentId) || rows[rows.length-1];
        if(rec && document.getElementById('post-confirm') && !document.getElementById('post-confirm').classList.contains('hidden')) {
          rec.status='Confirmed'; rec.priority=rec.priority==='Normal'?'Normal':'Needs review'; write(rows);
          saveNotice('Report submitted for supervisor review', `${rec.title} was confirmed by the health worker.`, 'success');
        }
      },80);
    });
  }
  if(role==='worker') {
    const table=document.querySelector('[data-module="my-reports"] .simple-table');
    if(table) {
      const header=table.querySelector('.simple-header')?.outerHTML || '';
      table.innerHTML=header+'<div class="simple-row"><span colspan="3">Live report history will appear here when the account has synced reports.</span></div>';
    }
  }
  if(role==='supervisor') {
    renderSupervisorRecords();
    const approveDraft=document.getElementById('approve-replenishment');
    approveDraft?.addEventListener('click',()=>{
      saveNotice('Replenishment draft approved', 'The supervisor approved the synthetic replenishment draft. No purchase order was created.', 'success');
      addActivity('Replenishment draft approved','Supervisor approved the draft for illustrative tracking. No purchase order was created.','Inventory','Approved');
      const response=document.getElementById('admin-response');
      if(response){ const copy=response.querySelector('#admin-action-copy'); if(copy) copy.textContent='Draft approved in this browser demo. The request is marked as sent for illustrative tracking only.'; }
    });
    document.querySelectorAll('[data-report-filter]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-report-filter]').forEach(item=>item.classList.toggle('active',item===button));
      const mode=button.dataset.reportFilter;
      document.querySelectorAll('[data-module="reports"] .simple-row:not(.simple-header)').forEach(row=>{
        const status=(row.children[2]?.textContent||'').toLowerCase();
        row.hidden=mode==='review'?!status.includes('review'):mode==='confirmed'?!status.includes('confirmed'):false;
      });
    }));
  }
})();
