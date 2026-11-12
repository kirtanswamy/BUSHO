(() => {
  const page=document.querySelector('[data-portal-role="storekeeper"]');
  if(!page)return;
  const host=document.getElementById('inventory-reconciliation-list');
  const message=document.getElementById('inventory-reconciliation-message');
  const refresh=document.getElementById('inventory-reconciliation-refresh');
  let client=null,items=[],loading=false,error='';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>{const d=new Date(v);return v&&!Number.isNaN(d.getTime())?d.toLocaleString():'—';};
  function render(){
    if(message)message.innerHTML=error?'<p class="portal-login-error" role="alert">'+esc(error)+'</p>':'<p class="muted-copy">These are evidence records, not a live stock balance. An opening balance and complete outbound ledger are not currently established.</p>';
    if(!host)return;
    if(loading&&!items.length){host.innerHTML='<p class="empty-state">Loading facility inventory…</p>';return;}
    if(error&&!items.length){host.innerHTML='<p class="empty-state">Inventory evidence could not be loaded.</p>';return;}
    if(!items.length){host.innerHTML='<p class="empty-state">No active inventory items are available in your assigned facility scope.</p>';return;}
    host.innerHTML=items.map(item=>{
      const snaps=Array.isArray(item.inventory_snapshots)?item.inventory_snapshots.slice().sort((a,b)=>new Date(b.observed_at)-new Date(a.observed_at)):[],
        moves=Array.isArray(item.inventory_movements)?item.inventory_movements.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)):[],
        latest=snaps[0],observed=latest?Number(latest.quantity):null,
        observedAt=latest?new Date(latest.observed_at).getTime():NaN,
        receiptTotal=moves.reduce((s,m)=>s+Number(m.quantity_delta||0),0),
        synthetic=[...snaps,...moves].some(x=>x.data_mode==='synthetic_demo'),
        fresh=latest&&Number.isFinite(observedAt)?Date.now()-observedAt<=7*86400000:null;
      return '<article class="module-card"><div class="module-card-head"><div><p class="card-overline">'+esc(item.item_code||'INVENTORY ITEM')+'</p><h3>'+esc(item.name)+'</h3><p>'+esc(item.unit)+'</p></div><span class="status-pill">'+(synthetic?'Synthetic evidence':'Evidence only')+'</span></div><div class="storekeeper-summary"><article class="supervisor-kpi"><span>Latest observation</span><strong>'+(observed===null?'—':esc(observed)+' '+esc(item.unit))+'</strong><small>'+(latest?esc(date(latest.observed_at)):'No observation recorded')+'</small></article><article class="supervisor-kpi"><span>Recorded inbound receipts</span><strong>'+esc(receiptTotal)+' '+esc(item.unit)+'</strong><small>'+moves.length+' ledger movements</small></article><article class="supervisor-kpi"><span>Observation freshness</span><strong>'+(fresh===null?'Unknown':fresh?'Within 7 days':'Older than 7 days')+'</strong><small>'+(latest?'Source: '+esc(latest.source||'unspecified'):'No dated observation')+'</small></article></div><p class="muted-copy"><strong>Calculated balance: not available.</strong> Receipt movements cannot be added to an observation without a known opening point and complete outbound movements. This screen does not claim physical verification.</p>'+(snaps.length?'<h4>Observation history</h4><ul>'+snaps.slice(0,5).map(s=>'<li>'+esc(s.quantity)+' '+esc(item.unit)+' · '+esc(s.source||'observation')+' · '+esc(date(s.observed_at))+(s.batch_number?' · Batch '+esc(s.batch_number):'')+(s.expiry_date?' · Expiry '+esc(s.expiry_date):'')+'</li>').join('')+'</ul>':'<p class="empty-state">No stock observations.</p>')+(moves.length?'<h4>Inbound receipt ledger</h4><ul>'+moves.map(m=>'<li>+'+esc(m.quantity_delta)+' '+esc(m.unit)+' · '+esc(m.external_reference)+' · '+esc(date(m.created_at))+'</li>').join('')+'</ul>':'<p class="empty-state">No inbound receipt movements.</p>')+'</article>';
    }).join('');
  }
  async function load(){if(!client||loading)return;loading=true;error='';render();try{const rows=await client.listInventory();items=Array.isArray(rows)?rows:[];}catch(e){error=e?.message||'Unable to load inventory evidence.';items=[];}finally{loading=false;render();}}
  refresh?.addEventListener('click',load);
  document.addEventListener('busho:authenticated',e=>{const p=e.detail?.profile;if(!p?.id||p.role!=='storekeeper')return;try{client=window.BUSHO_SUPABASE_CLIENT.createClient(window.BUSHO_SUPABASE_CONFIG);load();}catch(err){error=err?.message||'Inventory access unavailable.';render();}});
  document.addEventListener('busho:unauthenticated',()=>{client=null;items=[];loading=false;error='';render();});
})();