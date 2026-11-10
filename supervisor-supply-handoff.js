(() => {
  const page = document.querySelector('[data-portal-role="supervisor"]');
  if (!page) return;
  const list = document.getElementById('supply-handoff-list');
  const summary = document.getElementById('supply-handoff-summary');
  const message = document.getElementById('supply-handoff-message');
  const refresh = document.getElementById('supply-handoff-refresh');
  let client = null, activeRole = null, rows = [], busy = false, error = '', notice = '', refreshRequired = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const date = value => { const d = new Date(value); return value && !Number.isNaN(d.getTime()) ? d.toLocaleString() : '—'; };
  const status = value => ({recommended_to_facility_store:'Recommended · awaiting supervisor approval',supervisor_approved:'Approved · awaiting external submission',submitted_to_dpdmis:'Submitted · visible to storekeeper',returned_for_clarification:'Returned for clarification',allocated:'Allocated by storekeeper',dispatched:'Dispatched by storekeeper',partially_received:'Partially received',received:'Receipt completed'})[value] || String(value || 'Unknown').replaceAll('_',' ');
  function render(){
    if(message) message.innerHTML=[
      error?'<p class="portal-login-error" role="alert">'+esc(error)+'</p>':'',
      notice?'<p class="storekeeper-notice" role="status">'+esc(notice)+'</p>':''
    ].join('');
    if(summary) summary.innerHTML=[['Requests in scope',rows.length],['Awaiting approval',rows.filter(r=>r.status==='recommended_to_facility_store').length],['Awaiting submission',rows.filter(r=>r.status==='supervisor_approved').length],['With storekeeper',rows.filter(r=>['submitted_to_dpdmis','allocated','dispatched','partially_received','received'].includes(r.status)).length]].map(([k,v])=>'<article class="supervisor-kpi"><span>'+esc(k)+'</span><strong>'+v+'</strong><small>Authenticated facility-scoped records</small></article>').join('');
    if(!list)return;
    if(busy&&!rows.length){list.innerHTML='<p class="empty-state">Loading supply handoff…</p>';return;}
    if(error&&!rows.length){list.innerHTML='<p class="empty-state">The supply handoff could not be loaded. Retry after checking the message above.</p>';return;}
    if(!rows.length){list.innerHTML='<article class="module-card"><h3>No replenishment handoffs</h3><p class="empty-state">No requests are currently visible within your assigned supervisor scope. This is not a statewide stock status.</p></article>';return;}
    list.innerHTML=rows.map(r=>{
      const item=r.inventory_items||{}, canApprove=!refreshRequired&&activeRole==='supervisor'&&r.status==='recommended_to_facility_store', canSubmit=!refreshRequired&&activeRole==='supervisor'&&r.status==='supervisor_approved';
      return '<article class="module-card storekeeper-request" data-handoff-id="'+esc(r.id)+'"><div class="module-card-head"><div><p class="card-overline">'+esc(r.facilities?.name||'Assigned facility')+'</p><h3>'+esc(item.name||r.note||'Replenishment request')+'</h3><p>'+esc(r.requested_quantity)+' '+esc(r.unit||item.unit||'')+' requested · '+esc(r.on_hand_quantity??'—')+' reported on hand</p></div><span class="status-pill">'+esc(status(r.status))+'</span></div><dl class="storekeeper-facts"><div><dt>Source report</dt><dd>'+esc(r.source_report_id||'—')+'</dd></div><div><dt>Created</dt><dd>'+esc(date(r.created_at))+'</dd></div><div><dt>Supervisor decision</dt><dd>'+esc(r.reviewed_at_user?date(r.reviewed_at_user):'Not approved')+'</dd></div><div><dt>DPDMIS reference</dt><dd>'+esc(r.dpdmis_reference||'Not recorded')+'</dd></div><div><dt>Allocation reference</dt><dd>'+esc(r.allocation_reference||'Not recorded')+'</dd></div><div><dt>Dispatch reference</dt><dd>'+esc(r.dispatch_reference||'Not recorded')+'</dd></div><div><dt>Receipt progress</dt><dd>'+esc(r.received_quantity||0)+' / '+esc(r.requested_quantity)+' '+esc(r.unit||'')+'</dd></div><div><dt>Last update</dt><dd>'+esc(date(r.updated_at||r.created_at))+'</dd></div></dl>'+(canApprove?'<form class="handoff-action" data-action="approve"><label>Approval note (optional)<input name="note" maxlength="500" placeholder="Operational context"></label><button class="btn btn-primary" type="submit">Approve recommendation</button></form>':'')+(canSubmit?'<form class="handoff-action" data-action="submit"><label>External DPDMIS submission reference<input name="reference" required maxlength="120" placeholder="Enter reference after external submission"></label><button class="btn btn-primary" type="submit">Record submission reference</button></form>':'')+'<p class="muted-copy">Storekeeper handoff: '+(r.status==='submitted_to_dpdmis'?'Request is available to an assigned storekeeper.':(['allocated','dispatched','partially_received','received'].includes(r.status)?'Storekeeper has recorded progress.':'Not yet handed off.'))+'</p></article>';
    }).join('');
  }
  async function load() {
    if (!client || busy) return;
    busy = true;
    error = '';
    notice = '';
    render();

    try {
      const result = await client.listMyReplenishments();
      rows = Array.isArray(result) ? result : [];
      refreshRequired = false;
    } catch (e) {
      error = e?.message || 'Unable to load requests.';
      if (!refreshRequired) rows = [];
    } finally {
      busy = false;
      render();
    }
  }

  async function act(form) {
    if (busy || !client || refreshRequired) return;

    const card = form.closest('[data-handoff-id]');
    const id = card?.dataset.handoffId;
    const row = rows.find(x => x.id === id);
    if (!row) return;

    const data = new FormData(form);
    const action = form.dataset.action;
    const input = { id };

    if (action === 'approve' && row.status === 'recommended_to_facility_store') {
      input.status = 'supervisor_approved';
      input.note = String(data.get('note') || '').trim();
    } else if (action === 'submit' && row.status === 'supervisor_approved') {
      input.status = 'submitted_to_dpdmis';
      input.dpdmisReference = String(data.get('reference') || '').trim();

      if (!input.dpdmisReference) {
        error = 'Record the actual external DPDMIS submission reference.';
        render();
        return;
      }
    } else {
      return;
    }

    busy = true;
    error = '';
    notice = '';
    refreshRequired = true;
    render();

    try {
      await client.transitionReplenishmentRequest(input);
    } catch (e) {
      error = e?.message ||
        'The decision could not be confirmed. Refresh the handoff before retrying.';
      busy = false;
      render();
      return;
    }

    notice = 'Supervisor decision saved successfully.';
    try {
      const result = await client.listMyReplenishments();
      rows = Array.isArray(result) ? result : [];
      refreshRequired = false;
      notice = 'Decision saved and the latest handoff was refreshed.';
    } catch (e) {
      error = 'The decision was saved, but the handoff could not be refreshed. Use Refresh before taking another action.';
    }

    busy = false;
    render();
  }

  list?.addEventListener('submit',e=>{const f=e.target.closest('form.handoff-action');if(!f)return;e.preventDefault();act(f);});
  refresh?.addEventListener('click',load);
  document.addEventListener('busho:authenticated',e=>{const p=e.detail?.profile;if(!p?.id||!['supervisor','district_admin','state_admin'].includes(p.role))return;try{activeRole=p.role;client=window.BUSHO_SUPABASE_CLIENT.createClient(window.BUSHO_SUPABASE_CONFIG);load();}catch(err){error=err.message||'Secure handoff unavailable.';render();}});
  document.addEventListener('busho:unauthenticated',()=>{client=null;activeRole=null;rows=[];busy=false;error='';notice='';refreshRequired=false;render();});
})();
