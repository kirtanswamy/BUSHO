/* Profile and notification UI only. The workflow store remains the single reporting data source. */
(() => {
  'use strict';
  const role=document.querySelector('[data-portal-role]')?.dataset.portalRole;
  if(!role)return;
  const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const trigger=document.getElementById('profile-trigger');
  const menu=document.getElementById('profile-dropdown');
  const close=()=>{if(menu)menu.hidden=true;trigger?.setAttribute('aria-expanded','false');};
  trigger?.addEventListener('click',e=>{e.stopPropagation();menu.hidden=!menu.hidden;trigger.setAttribute('aria-expanded',String(!menu.hidden));});
  document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target)&&!trigger?.contains(e.target))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  menu?.querySelectorAll('[data-profile-action]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.profileAction;close();
    if(action==='signout')document.getElementById('portal-logout')?.click();
    else if(action==='facility')document.querySelector(`[data-portal-view="${role==='supervisor'?'facilities':'facility'}"]`)?.click();
    else if(action==='profile')document.querySelector('[data-portal-view="profile"]')?.click();
    else if(action==='preferences')document.getElementById('lang-select')?.focus();
  }));
  const topbar=document.querySelector('.topbar-right');
  if(!topbar)return;
  const read=()=>{try{const v=JSON.parse(localStorage.getItem('busho-demo-notice-read-v2')||'[]');return Array.isArray(v)?v:[];}catch{return[];}};
  const wrap=document.createElement('div');wrap.className='ops-notice-wrap';
  const button=document.createElement('button');button.type='button';button.className='ops-notice-trigger';button.setAttribute('aria-label','Notifications');
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>';
  const panel=document.createElement('section');panel.className='ops-notice-panel';panel.hidden=true;
  wrap.append(button,panel);topbar.prepend(wrap);
  function render(){
    const events=window.BUSHO_WORKFLOW?.getAuditLog?.()||[];
    const readIds=read(),unread=events.filter(e=>!readIds.includes(e.id)).length;
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>'+(unread?`<span class="ops-notice-count">${unread}</span>`:'');
    button.setAttribute('aria-label',`Notifications, ${unread} unread`);
    panel.innerHTML=`<div class="ops-notice-head"><strong>Workflow notifications</strong><button type="button" data-mark-read>Mark all read</button></div>${events.length?events.slice(0,10).map(e=>`<article class="ops-notice-item"><strong>${safe(e.action.replaceAll('_',' '))}</strong><p>${safe(e.note)}</p><small>${safe(e.actor)} · ${safe(new Date(e.at).toLocaleString())}</small></article>`).join(''):'<p class="ops-notice-empty">No workflow activity yet. New report and store events will appear here.</p>'}`;
    panel.querySelector('[data-mark-read]')?.addEventListener('click',()=>{try{localStorage.setItem('busho-demo-notice-read-v2',JSON.stringify(events.map(e=>e.id)));}catch{}render();});
  }
  button.addEventListener('click',()=>{panel.hidden=!panel.hidden;render();});
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))panel.hidden=true;});
  window.addEventListener('busho:workflow-updated',render);
  window.addEventListener('storage',e=>{if(e.key==='busho-operational-demo-v2'||e.key==='busho-demo-notice-read-v2')render();});
  render();
})();
