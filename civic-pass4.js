/* BUSHO Pass 4 — shared civic brand, account hub, field guidance and final presentation QA.
   Presentation layer only. Does not change authentication, RLS, data access or workflow transitions. */
(() => {
  'use strict';
  const body=document.body,root=document.documentElement;
  const role=body.dataset.portalRole||body.querySelector('[data-portal-role]')?.dataset.portalRole||'public';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label={worker:'SHC Health Worker',supervisor:'PHC Reviewer',storekeeper:'PHC Stock Custodian'};
  const tagline='Frontline SHC–PHC Medicine Stockout & Replenishment Layer';
  let profile=null,facility={name:'',lgd:'',parent:''},confirmingSignOut=false,menuReturnFocus=null,sopReturnFocus=null;
  const read=(k,d)=>{try{return localStorage.getItem(k)||d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
  const logoSvg=(size=38)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="'+size+'" height="'+size+'" aria-hidden="true" focusable="false"><rect x="2" y="2" width="36" height="36" rx="9" fill="#0B3D6B"/><path d="M20 5.5L31.5 9.8V19.8C31.5 26.8 26.6 32.2 20 34.5C13.4 32.2 8.5 26.8 8.5 19.8V9.8L20 5.5Z" fill="none" stroke="rgba(255,255,255,0.24)" stroke-width="1.3"/><rect x="17.75" y="10.5" width="4.5" height="13" rx="1.25" fill="#FFFFFF"/><rect x="13.5" y="14.75" width="13" height="4.5" rx="1.25" fill="#FFFFFF"/><circle cx="20" cy="17" r="1.6" fill="#F59E0B"/><path d="M14 28.2L20 24.5L26 28.2" fill="none" stroke="#2DD4BF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  window.renderBushoLogo=()=>logoSvg(38);
  function brand(){
    const links=$$('.brand-lockup,.lp-brand,.storekeeper-brand');
    links.forEach(a=>{
      const canonical=$('.busho-brand-mark',a);
      if(canonical){$('.civic-crest,.brand-mark,.lp-brand-mark',a).forEach(n=>n.remove());}
      else {const mark=$('.brand-mark,.lp-brand-mark,.civic-crest',a);if(mark)mark.outerHTML='<span class="busho-brand-mark">'+logoSvg(38)+'</span>';else a.insertAdjacentHTML('afterbegin','<span class="busho-brand-mark">'+logoSvg(38)+'</span>');}
      const title=$('.brand-name,.lp-brand-copy strong',a);if(title)title.textContent='BUSHO';
      const sub=$('.brand-subtitle,.lp-brand-copy small',a);
      if(sub)sub.textContent=tagline;
      else {const copy=$('.lp-brand-copy',a)||a;copy.insertAdjacentHTML('beforeend','<small class="brand-subtitle">'+tagline+'</small>');}
      a.classList.add('busho-brand-lockup');
    });
    const fav=$('link[rel~="icon"]')||(()=>{const n=document.createElement('link');n.rel='icon';document.head.append(n);return n})();
    fav.type='image/svg+xml';fav.href='/favicon.svg';
    $$('.portal-login-card').forEach(card=>{
      if($('.busho-login-brand',card))return;
      const node=document.createElement('div');node.className='busho-login-brand';
      node.innerHTML='<span>'+logoSvg(42)+'</span><span><strong>BUSHO</strong><small>'+tagline+'</small></span>';
      card.prepend(node);
    });
    const signinHeader=$('.signin-page .topbar');
    if(signinHeader&&!$('.brand-lockup',signinHeader)){
      const a=document.createElement('a');a.className='brand-lockup busho-brand-lockup';a.href='/';
      a.innerHTML='<span class="busho-brand-mark">'+logoSvg(38)+'</span><span><strong class="brand-name">BUSHO</strong><small class="brand-subtitle">'+tagline+'</small></span>';signinHeader.prepend(a);
    }
  }
  function toast(message,kind='info'){
    let host=$('#busho-toast-region');
    if(!host){host=document.createElement('div');host.id='busho-toast-region';host.className='busho-toast-region';host.setAttribute('role','status');host.setAttribute('aria-live','polite');host.setAttribute('aria-atomic','true');body.append(host);}
    const item=document.createElement('div');item.className='busho-toast busho-toast-'+kind;item.textContent=message;host.append(item);
    window.setTimeout(()=>{item.classList.add('is-leaving');window.setTimeout(()=>item.remove(),220)},3600);
  }
  function activeView(){
    const m=$('[data-module].active');return m?.dataset.module||'overview';
  }
  function gotoView(view){
    if(role==='public')return;
    const btn=$('[data-portal-view="'+view+'"]');
    if(btn){btn.click();return;}
    const fallback={'facility':'facility','profile':'profile','settings':'settings','stockouts':'stockouts','overview':'overview'};
    const target=fallback[view]||view,el=$('[data-module="'+target+'"]');
    if(el){$$('[data-module]').forEach(n=>{n.hidden=n!==el;n.classList.toggle('active',n===el)});const h=$('.civic-page-intro h1');if(h)h.textContent=el.querySelector('h2')?.textContent||view;}
  }
  function facilityFrom(p){
    const f=p?.facility||p?.assigned_facility||{};
    return {
      name:p?.facility_name||p?.assigned_facility_name||f.name||facility.name||'Not assigned',
      lgd:p?.facility_lgd_code||p?.block_lgd_code||p?.lgd_code||p?.lgdCode||f.lgd_code||f.block_lgd_code||f.lgd||facility.lgd||'Not assigned',
      parent:p?.parent_phc_name||p?.parent_facility_name||p?.parent_phc?.name||p?.parent?.name||facility.parent||(role==='storekeeper'?'Not applicable — PHC workspace':'Not assigned')
    };
  }
  function updateFacility(d){
    const f=d?.facility||d||{},p=d?.parent||{};
    if(f.name)facility.name=f.name;
    if(f.lgd_code||f.block_lgd_code||f.lgd||f.lgdCode)facility.lgd=f.lgd_code||f.block_lgd_code||f.lgd||f.lgdCode;
    if(p.name||d?.parent_phc_name)facility.parent=p.name||d.parent_phc_name;
    if(profile){const from=facilityFrom(profile);if(from.name!=='Not assigned')facility.name=from.name;if(from.lgd!=='Not assigned')facility.lgd=from.lgd;if(from.parent!=='Not assigned')facility.parent=from.parent;}
    syncAccount();
  }
  function cadre(){
    const value=profile?.cadre||profile?.designation||profile?.job_title||profile?.position;
    return value||'Not assigned';
  }
  function initials(){
    if(role==='worker')return 'HW';
    if(role==='storekeeper')return 'SK';
    return ['district_admin','state_admin'].includes(profile?.role)?'DS':'PR';
  }
  function connectionLabel(){
    return navigator.onLine?'Online · Sync status not verified':'Offline · Manual register mode';
  }
  function accountPanel(){
    const wrap=$('.profile-menu-wrap'),trigger=$('#profile-trigger'),panel=$('#profile-dropdown');
    if(!wrap||!trigger||!panel)return;
    wrap.classList.add('busho-account-wrap');
    trigger.setAttribute('aria-controls','profile-dropdown');trigger.setAttribute('aria-haspopup','dialog');
    trigger.innerHTML='<span class="profile-avatar busho-avatar">'+initials()+'</span><span class="profile-trigger-copy"><strong></strong><small></small></span><span class="profile-chevron" aria-hidden="true">⌄</span>';
    panel.classList.add('busho-account-panel');panel.setAttribute('aria-label','Operational account hub');
    panel.innerHTML='<div class="busho-account-identity"><div class="busho-account-identity-top"><span class="busho-account-avatar">'+initials()+'</span><div><strong data-busho-name></strong><span class="busho-role-pill">'+label[role]+'</span></div></div><dl><div><dt>Cadre</dt><dd data-busho-cadre></dd></div><div><dt>Verified facility</dt><dd data-busho-facility></dd></div><div><dt>LGD code</dt><dd data-busho-lgd></dd></div><div><dt>Parent PHC</dt><dd data-busho-parent></dd></div></dl><span class="busho-sync-badge" data-busho-connection></span></div><div class="busho-account-actions"><button type="button" data-busho-action="facility"><span>⌖</span><span><strong>My Facility & Scope</strong><small>Verified facility and parent link</small></span></button><button type="button" data-busho-action="profile"><span>◎</span><span><strong>Account & Authority Boundary</strong><small>Role, cadre and permitted actions</small></span></button><div class="busho-display-controls"><strong>Quick Display Controls</strong><div><button type="button" data-busho-contrast aria-pressed="false">High contrast</button><button type="button" data-busho-density aria-pressed="false">Compact density</button></div></div><button type="button" data-busho-action="print"><span>▤</span><span><strong>Print Current View (A4)</strong><small>Register-ready print layout</small></span></button><button type="button" data-busho-action="sop"><span>?</span><span><strong>Field SOP & Quick Guide</strong><small>Two-branch workflow and offline steps</small></span></button><a href="/signin" class="busho-account-action-link"><span>⇄</span><span><strong>Switch Workspace Role</strong><small>Return to role selection</small></span></a></div><div class="busho-account-footer"><button type="button" class="busho-signout-request" data-busho-action="signout">Sign out</button><div class="busho-signout-confirm" hidden role="alertdialog" aria-labelledby="busho-signout-title" aria-describedby="busho-signout-copy"><span class="busho-warning-icon" aria-hidden="true">!</span><strong id="busho-signout-title">Are you sure you want to sign out?</strong><p id="busho-signout-copy">Any unsaved draft or unsubmitted observation will not be saved.</p><div><button type="button" data-busho-cancel-signout>Cancel</button><button type="button" data-busho-confirm-signout>Yes, sign out</button></div></div><button type="button" id="portal-logout" data-profile-action="signout" hidden>Sign out</button></div>';
    const name=profile?.display_name|| (role==='worker'?'Health Worker':role==='storekeeper'?'PHC Stock Custodian':'PHC Reviewer');
    const tName=$('.profile-trigger-copy strong',trigger),tFacility=$('.profile-trigger-copy small',trigger);
    if(tName)tName.textContent=name;if(tFacility)tFacility.textContent=facility.name||'Facility not assigned';
    trigger.querySelector('.profile-avatar').textContent=initials();
    panel.querySelector('[data-busho-name]').textContent=name;
    panel.querySelector('[data-busho-cadre]').textContent=cadre();
    panel.querySelector('[data-busho-facility]').textContent=facility.name||'Not assigned';
    panel.querySelector('[data-busho-lgd]').textContent=facility.lgd||'Not assigned';
    panel.querySelector('[data-busho-parent]').textContent=facility.parent||'Not assigned';
    panel.querySelector('[data-busho-connection]').textContent='● '+connectionLabel();
    const contrast=read('busho-civic-contrast','normal')==='high',density=read('busho-civic-density','comfortable')==='compact';
    panel.querySelector('[data-busho-contrast]').setAttribute('aria-pressed',String(contrast));
    panel.querySelector('[data-busho-density]').setAttribute('aria-pressed',String(density));
  }
  function syncAccount(){
    const trigger=$('#profile-trigger'),panel=$('#profile-dropdown');if(!trigger||!panel)return;
    const n=$('.profile-trigger-copy strong',trigger),f=$('.profile-trigger-copy small',trigger);
    if(n)n.textContent=profile?.display_name||n.textContent;
    if(f)f.textContent=facility.name||'Facility not assigned';
    const set=(s,v)=>{const x=$(s,panel);if(x)x.textContent=v};
    set('[data-busho-name]',profile?.display_name||'Signed-in user');set('[data-busho-cadre]',cadre());set('[data-busho-facility]',facility.name||'Not assigned');set('[data-busho-lgd]',facility.lgd||'Not assigned');set('[data-busho-parent]',facility.parent||'Not assigned');set('[data-busho-connection]','● '+connectionLabel());
    const sc=$('#storekeeper-facility-context');if(sc)sc.textContent=facility.name;
    const ctx=$('#civic-facility-context');if(ctx)ctx.textContent=facility.name;
    const bar=$('.civic-facility-strip strong');if(bar&&facility.name&&facility.name!=='Not assigned')bar.textContent=facility.name;
    const sidebar=$('#storekeeper-sidebar-name');if(sidebar)sidebar.textContent=profile?.display_name||'Signed-in storekeeper';
    const a=$('#storekeeper-account-facility');if(a)a.textContent=facility.name;
    const d=$('#storekeeper-dropdown-facility');if(d)d.textContent=facility.name;
  }
  function accountEvents(){
    const wrap=$('.profile-menu-wrap'),trigger=$('#profile-trigger'),panel=$('#profile-dropdown');
    if(!wrap||!trigger||!panel)return;
    const close=()=>{panel.hidden=true;trigger.setAttribute('aria-expanded','false');};
    const open=()=>{panel.hidden=false;trigger.setAttribute('aria-expanded','true');};
    trigger.addEventListener('click',()=>{if(panel.hidden)open();else close()});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target))close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!panel.hidden){close();trigger.focus();}const confirm=$('.busho-signout-confirm',panel);if(confirm&&!confirm.hidden)cancelSignOut();}});
    panel.addEventListener('click',e=>{
      const action=e.target.closest('[data-busho-action]');if(!action)return;
      const kind=action.dataset.bushoAction;
      if(kind==='facility'){close();gotoView(role==='worker'?'facility':role==='supervisor'?'facilities':'account');}
      if(kind==='profile'){close();gotoView(role==='worker'?'profile':role==='supervisor'?'settings':'account');}
      if(kind==='print'){close();window.print();}
      if(kind==='sop'){close();openSop();}
      if(kind==='signout')showSignOut();
    });
    panel.addEventListener('click',e=>{
      if(e.target.closest('[data-busho-contrast]')){const high=root.dataset.contrast!=='high';setContrast(high);toast(high?'High contrast enabled':'High contrast disabled','success');}
      if(e.target.closest('[data-busho-density]')){const compact=root.dataset.density!=='compact';setDensity(compact);toast(compact?'Compact density enabled':'Comfortable density enabled','success');}
      if(e.target.closest('[data-busho-cancel-signout]'))cancelSignOut();
      if(e.target.closest('[data-busho-confirm-signout]')){
        const original=$('#portal-logout',panel);
        if(original){confirmingSignOut=true;original.click();}
        else toast('Sign-out control is unavailable. Please refresh and try again.','error');
      }
    });
    document.addEventListener('click',e=>{
      const target=e.target instanceof Element?e.target.closest('#portal-logout,[data-profile-action="signout"]'):null;
      if(!target||confirmingSignOut)return;
      e.preventDefault();e.stopImmediatePropagation();showSignOut();
    },true);
    function showSignOut(){const c=$('.busho-signout-confirm',panel);if(!c)return;c.hidden=false;panel.querySelector('.busho-signout-request').hidden=true;panel.querySelector('[data-busho-cancel-signout]').focus();}
    function cancelSignOut(){const c=$('.busho-signout-confirm',panel);if(!c||c.hidden)return;c.hidden=true;panel.querySelector('.busho-signout-request').hidden=false;panel.querySelector('.busho-signout-request').focus();}
    window.__bushoCancelSignOut=cancelSignOut;
    function handleSignoutState(){if(body.dataset.authState==='unauthenticated'){close();confirmingSignOut=false;}}
    document.addEventListener('busho:unauthenticated',handleSignoutState);
    window.addEventListener('online',syncAccount);window.addEventListener('offline',syncAccount);
    document.addEventListener('busho:authenticated',e=>{profile=e.detail?.profile||null;facility=facilityFrom(profile);accountPanel();syncAccount();});
  }
  function setContrast(on){
    if(on)root.dataset.contrast='high';else delete root.dataset.contrast;
    write('busho-civic-contrast',on?'high':'normal');
    const top=$('[data-contrast-toggle]');if(top)top.setAttribute('aria-pressed',String(on));
    const menu=$('[data-busho-contrast]');if(menu)menu.setAttribute('aria-pressed',String(on));
  }
  function setDensity(on){
    if(on)root.dataset.density='compact';else delete root.dataset.density;
    write('busho-civic-density',on?'compact':'comfortable');
    const menu=$('[data-busho-density]');if(menu)menu.setAttribute('aria-pressed',String(on));
    const top=$('[data-density-toggle]');if(top)top.setAttribute('aria-pressed',String(on));
  }
  function densityTopControl(){
    const tools=$('.civic-utility-tools');if(!tools||$('[data-density-toggle]',tools))return;
    const b=document.createElement('button');b.type='button';b.dataset.densityToggle='';b.textContent='Compact';b.setAttribute('aria-pressed',String(root.dataset.density==='compact'));tools.insertBefore(b,tools.querySelector('.civic-env-pill'));
    b.addEventListener('click',()=>{const compact=root.dataset.density!=='compact';setDensity(compact);toast(compact?'Compact density enabled':'Comfortable density enabled','success');});
  }
  function syncPrefs(){
    setContrast(read('busho-civic-contrast','normal')==='high');
    setDensity(read('busho-civic-density','comfortable')==='compact');
  }
  const branchSvg=(type)=>type==='aam'?'<svg viewBox="0 0 640 360" role="img" aria-label="Illustration of a rural Ayushman Arogya Mandir sub-health centre"><defs><linearGradient id="aamSky" x2="0" y2="1"><stop stop-color="#e8f2f7"/><stop offset="1" stop-color="#f8fbfc"/></linearGradient></defs><rect width="640" height="360" fill="url(#aamSky)"/><circle cx="520" cy="70" r="28" fill="#f7c873"/><path d="M0 270Q120 235 240 265T640 255V360H0Z" fill="#d7e8dc"/><path d="M100 168 320 75l220 93" fill="#0b3d6b"/><path d="M130 160h380v150H130Z" fill="#fff" stroke="#b8c9d3" stroke-width="4"/><path d="M280 215h80v95h-80Z" fill="#e4eef2" stroke="#9eb2c1" stroke-width="3"/><path d="M160 192h80v55h-80zm240 0h80v55h-80z" fill="#d9edf1" stroke="#9eb2c1" stroke-width="3"/><rect x="300" y="112" width="40" height="40" rx="8" fill="#fff"/><path d="M320 119v26m-13-13h26" stroke="#0b3d6b" stroke-width="6" stroke-linecap="round"/><path d="M160 286h320" stroke="#0f766e" stroke-width="6" stroke-linecap="round"/><path d="M70 312h500" stroke="#a8bdad" stroke-width="4"/><text x="320" y="338" fill="#31566d" font-size="14" text-anchor="middle" font-family="sans-serif">AAM · SHC FIELD WORKFLOW</text></svg>':'<svg viewBox="0 0 640 360" role="img" aria-label="Illustration of a rural primary health centre dispensary and medicine store"><rect width="640" height="360" fill="#edf4f7"/><circle cx="530" cy="66" r="24" fill="#f5c66b"/><path d="M0 280 150 238l130 22 140-50 220 62v88H0Z" fill="#dce9df"/><path d="M88 154 310 64l240 90" fill="#123f68"/><path d="M120 150h400v165H120Z" fill="#fff" stroke="#b7c7d2" stroke-width="4"/><rect x="155" y="180" width="130" height="100" rx="4" fill="#e5f1f3" stroke="#a5bbc7" stroke-width="3"/><path d="M170 202h100m-100 18h100m-100 18h100" stroke="#82a6b6" stroke-width="6"/><rect x="350" y="175" width="130" height="125" rx="4" fill="#f5f8f9" stroke="#a5bbc7" stroke-width="3"/><path d="M370 195h90v25h-90zm0 40h90v25h-90" fill="#dbe8ec" stroke="#9fb5c1" stroke-width="2"/><rect x="294" y="116" width="36" height="36" rx="7" fill="#fff"/><path d="M312 122v24m-12-12h24" stroke="#0b3d6b" stroke-width="5" stroke-linecap="round"/><path d="M90 315h460" stroke="#a8bdad" stroke-width="4"/><text x="320" y="342" fill="#31566d" font-size="14" text-anchor="middle" font-family="sans-serif">LINKED PHC · DISPENSARY / STORE</text></svg>';
  function landing(){
    if(!body.classList.contains('landing-v3'))return;
    const header=$('.lp-header');
    if(header&&!$('#busho-notices')){
      const bar=document.createElement('section');bar.id='busho-notices';bar.className='busho-notice-bar';bar.setAttribute('aria-label','Notices and operational updates');
      bar.innerHTML='<strong class="busho-notice-label"><i></i> NOTICES & UPDATES</strong><div class="busho-ticker-viewport"><div class="busho-ticker-track" id="busho-ticker-track"></div></div><div class="busho-ticker-controls"><button type="button" data-ticker="pause" aria-pressed="false">Pause</button><button type="button" data-ticker="prev">Prev</button><button type="button" data-ticker="next">Next</button><button type="button" data-ticker="all">View all</button></div>';
      header.after(bar);
    }
    const notices=[
      ['Workflow v1.0','SHC-to-PHC Two-Branch Stockout & Replenishment workflow frozen for Chhattisgarh reference pilot (Hypertension essential medicines).'],
      ['Data Privacy','Reminder: Do not enter patient names, phone numbers, ABHA IDs, or clinical diagnoses in BUSHO stockout records.'],
      ['Governance','Official facility paper registers and DPDMIS/CGMSC remain the sole authoritative stock ledgers; BUSHO records coordination evidence only.'],
      ['Field Readiness','Offline-safe workflow: Record physical handover references in registers when SHC connectivity drops and reconcile once back online.']
    ];
    let current=0,paused=false;
    const viewport=$('.busho-ticker-viewport'),track=$('#busho-ticker-track');
    if(viewport){viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Scrolling notices; focus here to pause the ticker');}
    const renderNotice=()=>{if(!track)return;track.innerHTML='<div class="busho-ticker-item"><b>['+esc(notices[current][0])+']</b> '+esc(notices[current][1])+'</div>';};
    if(track&&!track.dataset.ready){track.dataset.ready='1';renderNotice();}
    const controls=$('.busho-ticker-controls');
    if(controls&&!controls.dataset.ready){controls.dataset.ready='1';controls.addEventListener('click',e=>{const b=e.target.closest('[data-ticker]');if(!b)return;const action=b.dataset.ticker;if(action==='pause'){paused=!paused;track?.classList.toggle('is-paused',paused);b.textContent=paused?'Play':'Pause';b.setAttribute('aria-pressed',String(paused));}else if(action==='prev'||action==='next'){current=(current+(action==='next'?1:notices.length-1))%notices.length;renderNotice();}else if(action==='all')openNoticeModal(notices);});}
    if(viewport&&!viewport.dataset.pauseBound){viewport.dataset.pauseBound='1';viewport.addEventListener('mouseenter',()=>track?.classList.add('is-hover-paused'));viewport.addEventListener('mouseleave',()=>track?.classList.remove('is-hover-paused'));viewport.addEventListener('focusin',()=>track?.classList.add('is-hover-paused'));viewport.addEventListener('focusout',()=>track?.classList.remove('is-hover-paused'));}
    if(!$('#busho-field-showcase')){
      const section=document.createElement('section');section.id='busho-field-showcase';section.className='busho-field-showcase civic-section';
      section.innerHTML='<div class="civic-section-heading"><p class="civic-eyebrow">BUILT FOR AYUSHMAN AROGYA MANDIR & LINKED PHC WORKFLOWS</p><h2>Designed around the realities of frontline medicine continuity.</h2><p>Reference illustrations show the two facility contexts in the frozen SHC-to-PHC workflow. They are not photographs of named government facilities.</p></div><div class="busho-field-grid"><article class="busho-field-card"><div class="busho-field-art">'+branchSvg('aam')+'<img src="/assets/aam-shc-field.jpg" alt="Ayushman Arogya Mandir SHC field context" loading="lazy"></div><div><span>01 · FRONTLINE FACILITY</span><h3>Ayushman Arogya Mandir (SHC-AAM) Frontline</h3><p>CHO / ANM physical box check, stockout exception capture, and final last-mile receipt confirmation.</p></div></article><article class="busho-field-card"><div class="busho-field-art">'+branchSvg('phc')+'<img src="/assets/phc-store-workflow.jpg" alt="Linked primary health centre dispensary and store context" loading="lazy"></div><div><span>02 · LINKED FACILITY HUB</span><h3>Linked Primary Health Centre (PHC) Hub</h3><p>MOIC operational review, Pharmacist PHC-to-SHC handover, or official DPDMIS consolidated indent reference logging.</p></div></article></div>';
      const guarantees=$('.civic-guarantees');if(guarantees)guarantees.after(section);else $('main')?.prepend(section);
      $$('img',section).forEach(img=>{img.addEventListener('load',()=>img.classList.add('is-loaded'));img.addEventListener('error',()=>img.remove());});
    }
    if(!$('#busho-back-top')){const b=document.createElement('button');b.id='busho-back-top';b.type='button';b.textContent='Back to top ↑';b.setAttribute('aria-label','Back to top');b.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));body.append(b);window.addEventListener('scroll',()=>b.classList.toggle('is-visible',window.scrollY>560),{passive:true});}
  }
  function openNoticeModal(notices){
    let d=$('#busho-notice-dialog');if(!d){d=document.createElement('dialog');d.id='busho-notice-dialog';d.className='busho-notice-dialog';d.innerHTML='<div class="busho-dialog-head"><div><span>BUSHO · REFERENCE PILOT</span><h2>Notices & Operational Updates</h2></div><button type="button" data-dialog-close aria-label="Close notices">×</button></div><div class="busho-notice-list"></div><p class="busho-dialog-note">These are application governance notices, not government circulars or official orders.</p>';body.append(d);d.querySelector('[data-dialog-close]').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close()});}
    d.querySelector('.busho-notice-list').innerHTML=notices.map(n=>'<article><b>['+esc(n[0])+']</b><p>'+esc(n[1])+'</p></article>').join('');
    if(!d.open)d.showModal();
  }
  function openSop(){
    let drawer=$('#busho-sop-drawer');if(!drawer){
      drawer=document.createElement('div');drawer.id='busho-sop-drawer';drawer.className='busho-drawer-backdrop';drawer.innerHTML='<aside class="busho-sop-drawer" role="dialog" aria-modal="true" aria-labelledby="busho-sop-title"><header><div><span>FIELD REFERENCE · WORKFLOW FREEZE V1.0</span><h2 id="busho-sop-title">Quick SOP & Field Guide</h2></div><button type="button" data-sop-close aria-label="Close quick guide">×</button></header><div class="busho-sop-content"><section><h3>1-minute workflow summary</h3><div class="busho-sop-branches"><article><b>BRANCH 1 · PHC HAS STOCK</b><ol><li>PHC custodian checks official record and physical stock.</li><li>Record dated PHC-to-SHC handover evidence.</li><li>SHC worker physically collects and confirms receipt or discrepancy.</li><li>Close only after required receipt evidence.</li></ol></article><article><b>BRANCH 2 · PHC OUT OF STOCK</b><ol><li>PHC records an unavailable observation.</li><li>Authorised PHC user submits the consolidated indent in DPDMIS and records its external reference.</li><li>Record upstream receipt at PHC, then PHC-to-SHC handover.</li><li>SHC worker confirms physical receipt or discrepancy.</li></ol></article></div></section><section><h3>What BUSHO does vs. what remains official</h3><p><strong>BUSHO:</strong> facility-scoped exception coordination, dated observations, handover evidence and external reference tracking.</p><p><strong>Official:</strong> paper registers, DPDMIS/DVDMS, CGMSC, procurement authority and clinical decisions remain authoritative. BUSHO is not an inventory ledger or ordering portal.</p></section><section><h3>Offline / low-connectivity checklist</h3><ul><li>Use the prescribed paper register when connectivity is unavailable.</li><li>Record date, time, facility, medicine, quantity and external reference in the official register.</li><li>Do not enter patient names, phone numbers, ABHA IDs or diagnoses.</li><li>Reconcile the coordination evidence in BUSHO when connectivity returns; do not backdate or invent events.</li></ul></section><section><h3>Keyboard shortcuts</h3><dl><div><dt>Alt + H</dt><dd>Home / Overview</dd></div><div><dt>Alt + S</dt><dd>Stockout view</dd></div><div><dt>Alt + P</dt><dd>Print current view (A4)</dd></div><div><dt>Esc</dt><dd>Close drawer or modal</dd></div></dl></section></div></aside>';
      body.append(drawer);drawer.addEventListener('click',e=>{if(e.target===drawer)closeSop();});drawer.querySelector('[data-sop-close]').addEventListener('click',closeSop);
    }
    sopReturnFocus=document.activeElement?.closest?.('#profile-dropdown')?($('#busho-help-button')||$('#profile-trigger')):document.activeElement;drawer.classList.add('is-open');drawer.querySelector('[data-sop-close]').focus();body.classList.add('busho-drawer-open');
  }
  function closeSop(){const d=$('#busho-sop-drawer');if(d){d.classList.remove('is-open');body.classList.remove('busho-drawer-open');if(sopReturnFocus?.isConnected)sopReturnFocus.focus();sopReturnFocus=null;}}
  function helpButton(){
    if(role==='public')return;
    const right=$('.topbar-right,.storekeeper-topbar-right');if(!right||$('#busho-help-button'))return;
    const b=document.createElement('button');b.id='busho-help-button';b.type='button';b.className='busho-help-button';b.textContent='? Help / SOP';b.addEventListener('click',openSop);
    const wrap=$('.profile-menu-wrap',right);if(wrap)right.insertBefore(b,wrap);else right.append(b);
  }
  function printHeader(){
    if(role==='public')return;
    const main=$('#demo,.storekeeper-main');if(!main||$('.busho-print-meta',main))return;
    const n=document.createElement('div');n.className='busho-print-meta';
    n.innerHTML='<div class="busho-print-brand">'+logoSvg(40)+'<span><strong>BUSHO</strong><small>'+tagline+'</small></span></div><div class="busho-print-details"><b data-print-facility></b><span data-print-lgd></span><span data-print-time></span><span class="busho-print-watermark">SYNTHETIC PILOT · REFERENCE RECORD · NOT AN OFFICIAL REGISTER</span></div>';
    main.prepend(n);
    const update=()=>{const a=$('[data-print-facility]',n),b=$('[data-print-lgd]',n),c=$('[data-print-time]',n);if(a)a.textContent=facility.name||'Facility not assigned';if(b)b.textContent='LGD code: '+(facility.lgd||'Not recorded');if(c)c.textContent='Printed: '+new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST';};
    update();document.addEventListener('busho:authenticated',update);document.addEventListener('busho:worker-facility-context',update);document.addEventListener('busho:supervisor-facility-context',update);
  }
  function workspaceFixes(){
    if(role==='public')return;
    const main=$('#demo,.storekeeper-main');
    if(!main)return;
    const intro=$('.civic-page-intro',main);
    if(intro){
      const h=$('h1',intro);if(h&&role==='supervisor'&&activeView()==='settings')h.textContent='Settings';
      if(h&&role==='worker'&&activeView()==='overview')h.textContent='Operational Overview';
    }
    // Keep the shared H1/breadcrumb as the sole page heading; retain section descriptions.
    const clean=()=>{
      $$('.portal-module.active .module-heading h2,.storekeeper-main .portal-module.active .module-heading h2',main).forEach(h=>{h.classList.add('busho-secondary-heading-hidden');});
      $$('.portal-module.active .module-heading h1',main).forEach(h=>h.classList.add('busho-secondary-heading-hidden'));
      const headings=$$('.civic-page-intro h1',main);headings.forEach((h,i)=>{if(i)h.closest('.civic-page-intro')?.remove();});
    };
    clean();
    $$('.portal-module [data-module-heading],.portal-module .module-heading').forEach(()=>{});
    const nav=$$('.portal-module [data-module]');void nav;
    const side=$('.storekeeper-sidebar');
    if(role==='storekeeper'&&side){
      $$('.civic-sidebar-context',side).slice(1).forEach(n=>n.remove());
      const context=$('.civic-sidebar-context',side);
      if(context){context.innerHTML='<small>ROLE WORKSPACE</small><strong>PHC Stock Custodian</strong><span id="civic-facility-context">'+esc(facility.name||'Facility assignment resolves after sign-in')+'</span>';}
      const oldBrand=$('.sidebar-brand',side);if(oldBrand)oldBrand.remove();
      $$('.storekeeper-guide li strong').forEach(n=>{n.textContent=n.textContent.replace(/^\s*\d+\.\s*/,'');});
      const overview=$('[data-module="overview"]',main);
      if(overview){
        const ctas=$$('button[data-go-view="stockouts"]',overview);
        ctas.slice(1).forEach(n=>n.remove());
        const secondary=$$('button[data-go-view="requests"]',overview);
        secondary.slice(1).forEach(n=>n.remove());
        const primary=ctas[0];if(primary){primary.textContent='Open SHC stockout handovers →';primary.classList.add('btn-primary');}
        if(primary&&!secondary.length){const b=document.createElement('button');b.type='button';b.className='btn btn-secondary';b.dataset.goView='requests';b.textContent='View replenishment queue';primary.after(b);}
      }
      const account=$('[data-module="account"]',main);
      if(account)$$('p',account).forEach(p=>{if(/ask the supervisor to create and advance a supply recommendation/i.test(p.textContent))p.remove();});
      const moduleTitles={overview:'Operational Overview',stockouts:'SHC Stockout Handovers',requests:'Replenishment queue',inventory:'Inventory evidence',account:'Account & guidance'};
      const setTitle=()=>{const key=activeView(),title=moduleTitles[key];const h=$('.civic-page-intro h1',main);if(h&&title)h.textContent=title;};
      setTitle();$$('[data-portal-view]',side).forEach(b=>b.addEventListener('click',()=>window.setTimeout(()=>{clean();setTitle()},0)));
    }
    if(role==='supervisor'){
      const settings=$('[data-module="settings"]',main);if(settings){const h=$('.module-heading h2',settings);if(h)h.textContent='Settings';}
      const overview=$('[data-module="overview"],[data-module="overview-content"]',main);
      if(overview)$$('*',overview).forEach(n=>{if(n.children.length===0&&/supervisor\s*[·-]\s*facility-scoped/i.test(n.textContent))n.remove();});
      const stock=$('[data-module="stockout-review"]',main);if(stock)$('.supervisor-kpi',stock).forEach((n,i)=>n.dataset.kpiAccent=['info','warning','success'][i%3]);
      ['stockout-review','supply-handoff'].forEach(view=>{const section=$('[data-module="'+view+'"]',main);if(section)$('button,a',section).filter(n=>/^refresh(\\s|$)/i.test(n.textContent.trim())).forEach(n=>{n.classList.add('btn','btn-secondary','busho-refresh');});});
      const activity=$('[data-module="activity"]',main);
      if(activity){
        const normalize=()=>{
          $$('.activity-status,.status-pill,.status-chip',activity).forEach(n=>{
            const raw=(n.dataset.status||n.textContent).toLowerCase();
            let state='neutral',text=n.textContent.trim();
            if(/closed/.test(raw)){state='success';text='Closed';}
            else if(/verified/.test(raw)){state='success';text='Verified';}
            else if(/awaiting/.test(raw)){state='warning';text='Awaiting review';}
            else if(/draft/.test(raw)){state='neutral';text='Draft';}
            n.dataset.state=state;n.classList.add('busho-semantic-pill');n.textContent=(state==='success'?'✓ ':state==='warning'?'◷ ':'○ ')+text;
          });
          $$('*',activity).forEach(n=>{if(n.children.length)return;const t=n.textContent.trim();if(/^report created$/i.test(t))n.textContent='Report created';else if(/^supervisor$/i.test(t))n.textContent='PHC Reviewer';else if(/^worker$/i.test(t))n.textContent='SHC Health Worker';});
          $$('button,a',activity).filter(n=>/^refresh$/i.test(n.textContent.trim())).forEach(n=>n.classList.add('btn','btn-secondary','busho-refresh'));
        };normalize();
        new MutationObserver(()=>normalize()).observe(activity,{childList:true,subtree:true});
      }
    }
    if(role==='worker'){
      const overview=$('[data-module="overview"]',main);
      if(overview){
        const primary=$$('button[data-go-view],a[data-go-view]',overview).find(n=>/stockout|report/i.test(n.textContent));
        if(primary){primary.textContent='+ Report medicine stockout';primary.dataset.goView='stockouts';primary.classList.add('btn-primary');}
        let secondary=$$('button[data-go-view],a[data-go-view]',overview).find(n=>n.dataset.goView==='new-report');
        if(!secondary){secondary=document.createElement('button');secondary.type='button';secondary.dataset.goView='new-report';secondary.className='btn btn-secondary';primary?.after(secondary);}
        if(secondary)secondary.textContent='+ New field update';
      }
      const report=$('[data-module="new-report"]',main);
      if(report)$$('p',report).forEach(p=>{if(/run the demo to create a review draft|run the demo/i.test(p.textContent))p.textContent='Enter or dictate a field update and select Extract report to preview structured fields before confirming.';});
      const empty=$('[data-module="stockouts"] .empty-state,[data-module="stockouts"] .empty-guidance',main);
      if(empty&&!$('.busho-empty-icon',empty)){empty.classList.add('busho-stockout-empty');empty.insertAdjacentHTML('afterbegin','<span class="busho-empty-icon" aria-hidden="true"><svg viewBox="0 0 40 40"><rect x="5" y="6" width="30" height="28" rx="6"/><path d="M12 14h16M12 21h16M12 28h9"/></svg></span>');}
    }
    clean();
  }
  function syncHeaderText(){
    if(role==='public')return;
    const intro=$('.civic-page-intro');
    const key=activeView();
    const names={worker:{overview:'Operational Overview',stockouts:'Medicine Stockout','new-report':'New Report','my-reports':'My Reports',pending:'Pending Confirmation',facility:'My Facility',profile:'My Profile'},supervisor:{overview:'Operational Overview',reports:'Reports Inbox','stockout-review':'SHC Stockouts',facilities:'Facilities',workers:'Health Workers','supply-handoff':'Supply handoff',activity:'Activity Log',settings:'Settings'},storekeeper:{overview:'Operational Overview',stockouts:'SHC Stockout Handovers',requests:'Replenishment queue',inventory:'Inventory evidence',account:'Account & guidance'}};
    const h=$('.civic-page-intro h1');if(h&&names[role]?.[key])h.textContent=names[role][key];
    $('.portal-module.active .module-heading h2,.portal-module.active .module-heading h1').forEach(n=>n.classList.add('busho-secondary-heading-hidden'));
  }
  function events(){
    document.addEventListener('busho:authenticated',e=>{
      profile=e.detail?.profile||null;facility=facilityFrom(profile);
      accountPanel();syncAccount();syncHeaderText();printHeader();
      toast('Signed in to the '+(label[role]||'BUSHO')+' workspace.','success');
    });
    document.addEventListener('busho:worker-facility-context',e=>{updateFacility(e.detail);});
    document.addEventListener('busho:supervisor-facility-context',e=>{if(e.detail?.facilityName)facility.name=e.detail.facilityName;syncAccount();});
    document.addEventListener('busho:unauthenticated',()=>{profile=null;});
    document.addEventListener('click',e=>{
      const refresh=e.target instanceof Element?e.target.closest('button,a'):null;
      if(refresh&&/^refresh(\s|$)/i.test(refresh.textContent.trim()))toast('Refreshing the current facility-scoped view…','info');
      const view=e.target instanceof Element?e.target.closest('[data-portal-view],[data-go-view]'):null;
      if(view)window.setTimeout(syncHeaderText,0);
    });
    document.addEventListener('change',e=>{
      if(e.target.matches('#lang-select,[data-pref-language]'))toast('Language preference updated for this browser.','success');
      if(e.target.matches('[data-contrast-toggle],[data-pref-contrast]'))toast('Display contrast preference updated.','success');
    });
    document.addEventListener('submit',e=>{
      const f=e.target;if(!(f instanceof HTMLFormElement))return;
      if(f.id==='portal-login-form')return;
      toast('Submission started. Confirm the resulting status before leaving this view.','info');
    },true);
    ['busho:report-saved','busho:stockout-saved','busho:report-submitted','busho:stockout-submitted'].forEach(name=>document.addEventListener(name,()=>toast('Record saved or submitted. Check its displayed status and evidence.','success')));
    const liveSeen=new WeakMap();
    const watchLive=()=>$('[aria-live]').forEach(node=>{
      if(liveSeen.has(node))return;liveSeen.set(node,node.textContent.trim());
      new MutationObserver(()=>{
        const textNow=node.textContent.trim();if(!textNow||textNow===liveSeen.get(node))return;
        liveSeen.set(node,textNow);
        if(/\\b(saved|submitted|successfully recorded|receipt recorded|handover recorded)\\b/i.test(textNow))toast('Update recorded. Review the displayed status and evidence.','success');
      }).observe(node,{childList:true,subtree:true,characterData:true});
    });
    watchLive();window.addEventListener('load',watchLive,{once:true});
    window.addEventListener('online',()=>{toast('Connection restored. Reconcile any paper-register activity before updating BUSHO.','success');syncAccount();});
    window.addEventListener('offline',()=>{toast('Offline mode: use the official paper register and reconcile when connectivity returns.','warning');syncAccount();});
    document.addEventListener('keydown',e=>{
      if(e.altKey&&e.key.toLowerCase()==='h'){e.preventDefault();gotoView('overview');}
      if(e.altKey&&e.key.toLowerCase()==='s'){e.preventDefault();gotoView(role==='supervisor'?'stockout-review':'stockouts');}
      if(e.altKey&&e.key.toLowerCase()==='p'){e.preventDefault();window.print();}
      if(e.key==='Escape'){closeSop();}
      const drawer=$('#busho-sop-drawer.is-open');if(e.key==='Tab'&&drawer){const nodes=$('button,a,input,select,textarea,[tabindex]:not([tabindex="-1"])',drawer).filter(n=>!n.disabled);if(nodes.length){const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
    });
  }
  function init(){
    brand();syncPrefs();densityTopControl();landing();
    if(['worker','supervisor','storekeeper'].includes(role)){
      accountPanel();accountEvents();helpButton();printHeader();workspaceFixes();
    }
    events();
    window.addEventListener('load',()=>{brand();densityTopControl();workspaceFixes();syncHeaderText();},{once:true});
    const auth=body.dataset.authState==='authenticated';
    if(auth){profile=window.BUSHO_AUTH_PROFILE||profile;accountPanel();syncAccount();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();