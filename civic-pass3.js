/* BUSHO Pass 3: shared routing, authenticated shell and page-context polish.
   Presentation and navigation only. Auth policy, RLS and workflow transitions remain authoritative. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const body=document.body, role=body.dataset.portalRole||body.querySelector('[data-portal-role]')?.dataset.portalRole||'public';
  const names={worker:'SHC Health Worker',supervisor:'PHC Reviewer',storekeeper:'PHC Stock Custodian'};
  const views={
    worker:{overview:'Operational Overview',stockouts:'Medicine Stockout','new-report':'New Report','my-reports':'My Reports',pending:'Pending Confirmation',facility:'My Facility',profile:'My Profile'},
    supervisor:{overview:'Operational Overview',reports:'Reports Inbox', 'stockout-review':'SHC Stockouts',facilities:'Facilities',workers:'Health Workers','supply-handoff':'Supply handoff',activity:'Activity Log',settings:'Settings'},
    storekeeper:{overview:'Operational Overview',stockouts:'SHC Stockout Handovers',requests:'Replenishment queue',inventory:'Inventory evidence',account:'Account & guidance'}
  };
  const read=(k,d)=>{try{return localStorage.getItem(k)||d}catch{return d}};
  function authState(auth,profile){
    body.dataset.authState=auth?'authenticated':'unauthenticated';
    const header=$('.topbar,.storekeeper-topbar');
    if(!header)return;
    const wrap=$('.profile-menu-wrap',header),all=$('.civic-all-workspaces',header);
    if(wrap)wrap.hidden=!auth;
    if(all)all.hidden=auth;
    if(!auth)return;
    const display=profile?.display_name|| (role==='storekeeper'?'Demo Storekeeper':role==='worker'?'Health Worker':'PHC Reviewer');
    const facility=profile?.facility_name||profile?.assigned_facility_name||'Assigned facility · database-scoped access';
    const trigger=$('#profile-trigger',header);
    if(trigger){
      const strong=$('.profile-trigger-copy strong',trigger),small=$('.profile-trigger-copy small',trigger);
      if(strong)strong.textContent=display;
      if(small)small.textContent=facility;
    }
    if(role==='storekeeper'){
      ['#storekeeper-name','#storekeeper-account-name'].forEach(s=>{const n=$(s,header);if(n)n.textContent=display});
      ['#storekeeper-account-facility','#storekeeper-dropdown-facility'].forEach(s=>{const n=$(s,header);if(n)n.textContent=facility});
    }
  }
  function headerGate(){
    if(!['worker','supervisor','storekeeper'].includes(role))return;
    const header=$('.topbar,.storekeeper-topbar');
    if(!header)return;
    if(!$('.civic-all-workspaces',header)){
      const a=document.createElement('a');a.className='civic-all-workspaces';a.href='/signin';a.textContent='← All workspaces';
      const right=$('.topbar-right',header)||header;right.insertBefore(a,$('.profile-menu-wrap',right)||null);
    }
    const wrap=$('.profile-menu-wrap',header);
    if(wrap)wrap.hidden=body.dataset.authState!=='authenticated';
    const all=$('.civic-all-workspaces',header);if(all)all.hidden=body.dataset.authState==='authenticated';
    if(role==='storekeeper'){
      const pass2Account=$('.civic-storekeeper-account',header),logout=$('#portal-logout',header),drop=$('#profile-dropdown',header);
      if(pass2Account){if(logout&&drop&&!drop.contains(logout))drop.append(logout);pass2Account.remove();}
      const trigger=$('#profile-trigger',header);
      if(trigger){
        trigger.querySelector('.profile-avatar')?.classList.add('civic-avatar-square');
        trigger.querySelector('.profile-trigger-copy strong')?.setAttribute('id','storekeeper-name');
        const signout=$('#portal-logout',header);if(signout)signout.textContent='Sign out';
      }
    }
  }
  function updateContext(){
    if(!['worker','supervisor','storekeeper'].includes(role))return;
    const main=$('#demo')||$('.storekeeper-main')||$('main');
    if(!main)return;
    const active=$('.portal-module.active',main);
    let key=active?.dataset.module;
    if(role==='supervisor'&&key==='overview-content')key='overview';
    const title=views[role]?.[key]||views[role]?.overview||'Workspace';
    const intro=$('.civic-page-intro',main);
    if(intro){
      const h=$('h1',intro),crumb=$('.civic-breadcrumb',intro);
      if(h&&h.textContent!==title)h.textContent=title;
      const crumbText='BUSHO / '+names[role]+' / '+title;
      if(crumb&&crumb.textContent!==crumbText)crumb.textContent=crumbText;
    }
    const strips=$('.civic-facility-strip,.civic-scope-bar',main);
    if(strips.length>1)strips.slice(1).forEach(n=>n.remove());
    const facilityStrip=$('.civic-facility-strip',main);
    if(intro&&facilityStrip&&intro.nextElementSibling!==facilityStrip)intro.after(facilityStrip);
    const duplicate=$('.demo-header',main);if(role==='worker'&&duplicate)duplicate.remove();
    const oldScope=$('.civic-scope-bar',main);if(oldScope)oldScope.remove();
    const strip=$('.civic-facility-strip',main);
    if(strip){
      const first=$('span:first-child b',strip),second=$('span:nth-child(2) b',strip);
      if(role==='worker'){
        if(first&&first.textContent!=='ACTIVE FACILITY')first.textContent='ACTIVE FACILITY';
        if(second&&second.textContent!=='VERIFIED PARENT PHC')second.textContent='VERIFIED PARENT PHC';
        const facility=$('#civic-shc-name'),district=$('#civic-shc-district'),lgd=$('#civic-shc-lgd');
        const value=[facility?.textContent,district?.textContent,lgd?.textContent].filter(x=>x&&!/loading|not recorded|^—$/i.test(x));
        const strong=$('span:first-child strong',strip);
        if(strong&&value.length&&strong.textContent!==value.join(' · '))strong.textContent=value.join(' · ');
        const parent=$('#civic-parent-phc'),parentStrong=$('span:nth-child(2) strong',strip);
        if(parent&&parentStrong&&parent.textContent.trim()&&!/pending|not recorded/i.test(parent.textContent)&&parentStrong.textContent!==parent.textContent.trim())parentStrong.textContent=parent.textContent.trim();
      }else{
        if(first&&first.textContent!=='ASSIGNED PHC')first.textContent='ASSIGNED PHC';
        if(second&&second.textContent!=='ACCESS SCOPE')second.textContent='ACCESS SCOPE';
      }
    }
  }
  function decorateEmpty(root=document){
    $$('.empty-state',root).forEach(n=>{
      const svg=$('svg',n);if(svg){svg.setAttribute('width','36');svg.setAttribute('height','36');}
      const strong=$('strong',n);if(strong)strong.classList.add('empty-state-title');
      const spans=$$('span',n);spans.forEach(x=>x.classList.add('empty-state-text'));
      n.classList.add('civic-empty-state');
    });
  }
  function storekeeperCopy(){
    if(role!=='storekeeper')return;
    const side=$('.storekeeper-sidebar');
    if(side&&!$('.civic-sidebar-context',side)){
      const c=document.createElement('div');c.className='civic-sidebar-context';c.innerHTML='<small>ROLE WORKSPACE</small><strong>PHC Stock Custodian</strong><span>Assigned PHC · facility-scoped access</span>';side.prepend(c);
    }
    const buttons=$$('[data-portal-view]',side||document),o=buttons.find(x=>x.dataset.portalView==='overview'),h=buttons.find(x=>x.dataset.portalView==='stockouts');
    if(o&&h)o.after(h);
    const guide=$('.storekeeper-guide');
    if(guide){
      const steps=[
        ['1. Check PHC Stock Availability','Check official PHC registers/DPDMIS records and physically verify usable stock for an accepted SHC stockout request. This dated observation is evidence, not an authoritative stock balance.'],
        ['2. Branch 1 — PHC Stock Available (Handover)','Record the official PHC-to-SHC issue in the prescribed register/system, then log the handover quantity, actor, timestamp, and optional reference in BUSHO for SHC collection.'],
        ['3. Branch 2 — PHC Stock Unavailable (External Indent)','Mark PHC unable to fulfil. Once the authorised PHC user submits the consolidated facility indent in DPDMIS/government portal, manually record the external reference and track upstream receipt at PHC before onward SHC handover.'],
        ['4. Close After SHC Physical Receipt','The SHC worker physically counts and confirms receipt (or records any shortage/discrepancy). Cases close only after last-mile SHC receipt evidence is recorded.']
      ];
      $$('li',guide).forEach((li,i)=>{if(!steps[i])return;const head=$('strong',li),span=$('span',li);if(head)head.textContent=steps[i][0];if(span)span.textContent=steps[i][1]});
      const note=guide.parentElement?.querySelector('.muted-copy');if(note)note.textContent='BUSHO tracks coordination handovers and external references only; official paper registers and DPDMIS/CGMSC remain the authoritative systems of record.';
      const primary=guide.parentElement?.querySelector('[data-go-view]');
      if(primary){primary.textContent='Open SHC stockout handovers →';primary.dataset.goView='stockouts';}
      if(primary&&!primary.parentElement.querySelector('[data-go-view="requests"]')){const a=document.createElement('button');a.type='button';a.className='btn btn-secondary';a.dataset.pass3Queue='true';a.textContent='View replenishment queue';a.addEventListener('click',()=>$$('[data-portal-view="requests"]')[0]?.click());primary.after(a);}
    }
    const main=$('.storekeeper-main');if(main){
      const strip=$('.civic-facility-strip',main);if(strip){const labels=$$('b',strip);if(labels[0])labels[0].textContent='ASSIGNED PHC';if(labels[1])labels[1].textContent='ACCESS SCOPE';}
    }
    const menu=$('#profile-dropdown');menu?.querySelector('[data-profile-action="guidance"]')?.addEventListener('click',()=>$$('[data-portal-view="account"]')[0]?.click());
  }
  function init(){
    headerGate();authState(body.dataset.authState==='authenticated');
    if(role==='worker'||role==='supervisor'){
      const card=$('.portal-login-card'),eyebrow=$('.section-kicker',card),heading=$('h1',card),submit=$('button[type="submit"]',card);
      if(eyebrow)eyebrow.textContent='SECURE ACCESS · '+(role==='worker'?'SHC HEALTH WORKER':'PHC REVIEWER');
      if(heading)heading.textContent=names[role];
      if(submit)submit.textContent='Sign in securely';
    }
    if(role==='storekeeper')storekeeperCopy();
    if(role==='worker'){
      const metrics=$('.worker-overview-metrics');if(metrics&&!$('[data-pass3-open-kpi]',metrics)){const card=document.createElement('article');card.className='overview-stat';card.dataset.pass3OpenKpi='true';card.innerHTML='<span>Active SHC stockout requests</span><strong>—</strong><small>Loaded from your authorised SHC case records</small>';metrics.append(card);}
      const main=$('#demo');$('.demo-header',main||document)?.remove();
    }
    if(role==='supervisor'){$('.demo-header',$('#demo')||document)?.remove();}
    updateContext();decorateEmpty();
    const app=$('#portal-app')||document;
    const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='childList')r.addedNodes.forEach(n=>{if(n.nodeType===1)decorateEmpty(n)});}updateContext();});
    observer.observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
    $$('[data-portal-view]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(updateContext)));
    document.addEventListener('busho:authenticated',e=>{authState(true,e.detail?.profile||{});updateContext();});
    document.addEventListener('busho:unauthenticated',()=>authState(false));
    document.addEventListener('busho:worker-stockout-count',e=>{const card=$('[data-pass3-open-kpi]');const value=$('strong',card||document);if(card&&value)value.textContent=String(e.detail?.activeCount??'—');});
    document.addEventListener('busho:worker-facility-context',e=>{
      requestAnimationFrame(updateContext);
      const parent=e.detail?.parent?.name,facility=e.detail?.facility?.name,district=e.detail?.facility?.district;
      const label=role==='worker'?[facility,district].filter(Boolean).join(' · '):parent;
      if(label){const small=$('.profile-trigger-copy small');if(small&&body.dataset.authState==='authenticated')small.textContent=label;}
    });
    document.addEventListener('busho:storekeeper-facility-context',e=>{
      const label=[e.detail?.facilityName,e.detail?.district].filter(Boolean).join(' · ');if(!label)return;
      ['#storekeeper-account-facility','#storekeeper-dropdown-facility'].forEach(sel=>{const n=$(sel);if(n)n.textContent=label;});
      const small=$('.profile-trigger-copy small');if(small)small.textContent=label;
      const side=$('.civic-sidebar-context span');if(side)side.textContent=label;
      const strong=$('span:first-child strong',$('.civic-facility-strip')||document);if(strong)strong.textContent=label;
    });
    document.addEventListener('busho:supervisor-facility-context',e=>{
      const label=e.detail?.facilityName;if(!label)return;
      const small=$('.profile-trigger-copy small');if(small)small.textContent=label;
      const scope=$('#civic-scope-facility');if(scope)scope.textContent=label;
      const side=$('.civic-sidebar-context span');if(side)side.textContent=label;
    });
    if(role==='storekeeper'){
      const trigger=$('#profile-trigger'),menu=$('#profile-dropdown');
      trigger?.addEventListener('click',e=>{e.stopPropagation();const open=trigger.getAttribute('aria-expanded')!=='true';trigger.setAttribute('aria-expanded',String(open));if(menu)menu.hidden=!open;});
      document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target)&&!trigger?.contains(e.target)){menu.hidden=true;trigger?.setAttribute('aria-expanded','false');}});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(menu)menu.hidden=true;trigger?.setAttribute('aria-expanded','false');}});
    }
    document.addEventListener('click',e=>{const sign=e.target.closest('[data-profile-action="guidance"]');if(sign){e.preventDefault();$('[data-portal-view="account"]')[0]?.click();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();