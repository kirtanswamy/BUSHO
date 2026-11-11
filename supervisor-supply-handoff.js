(() => {
  const page = document.querySelector('[data-portal-role="supervisor"]');
  if (!page) return;
  const list = document.getElementById('supply-handoff-list');
  const summary = document.getElementById('supply-handoff-summary');
  const message = document.getElementById('supply-handoff-message');
  const refresh = document.getElementById('supply-handoff-refresh');
  const recommendation = document.getElementById('supply-recommendation');
  let client = null, activeRole = null, rows = [], reports = [], inventory = [], busy = false, error = '', notice = '', refreshRequired = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const date = value => { const d = new Date(value); return value && !Number.isNaN(d.getTime()) ? d.toLocaleString() : '—'; };
  const status = value => ({recommended_to_facility_store:'Recommended · awaiting supervisor approval',supervisor_approved:'Approved · awaiting external submission',submitted_to_dpdmis:'Submitted · visible to storekeeper',returned_for_clarification:'Returned for clarification',allocated:'Allocated by storekeeper',dispatched:'Dispatched by storekeeper',partially_received:'Partially received',received:'Receipt completed'})[value] || String(value || 'Unknown').replaceAll('_',' ');
  function renderRecommendation(){
    if(!recommendation)return;
    if(activeRole!=='supervisor'){recommendation.innerHTML='';return;}
    const verified=reports.filter(r=>r.status==='supervisor_verified'&&r.facility_id);
    const currentId=recommendation.querySelector('[name="sourceReportId"]')?.value;
    const report=verified.find(r=>r.id===currentId)||verified[0]||null;
    const items=report?inventory.filter(i=>i.facility_id===report.facility_id&&i.is_active!==false&&i.id&&i.unit):[];
    const currentItem=recommendation.querySelector('[name="inventoryItemId"]')?.value;
    const item=items.find(i=>i.id===currentItem)||items[0]||null;
    recommendation.innerHTML='<article class="module-card"><div class="module-card-head"><div><p class="card-overline">NEW SUPPLY RECOMMENDATION</p><h3>Create a facility replenishment recommendation</h3><p>Only supervisor-verified reports and active inventory items from the same facility are eligible.</p></div></div>'+
      (verified.length&&items.length?'<form class="handoff-action" id="supply-recommendation-form">'+
      '<label>Verified source report<select name="sourceReportId" required>'+verified.map(r=>'<option value="'+esc(r.id)+'" '+(r.id===report.id?'selected':'')+'>'+esc((r.facilities?.name||'Assigned facility')+' · '+(r.reporting_date||date(r.submitted_at||r.created_at))+' · '+r.id.slice(0,8))+'</option>').join('')+'</select></label>'+
      '<label>Inventory item<select name="inventoryItemId" required>'+items.map(i=>'<option value="'+esc(i.id)+'" '+(item&&i.id===item.id?'selected':'')+'>'+esc(i.name||i.item_code||'Inventory item')+' · '+esc(i.unit)+'</option>').join('')+'</select></label>'+
      '<div class="form-grid"><label>Requested quantity<input name="requestedQuantity" type="number" min="1" step="1" required inputmode="numeric" placeholder="e.g. 10"></label><label>Reported on-hand quantity<input name="onHandQuantity" type="number" min="0" step="1" required inputmode="numeric" placeholder="e.g. 2"></label></div>'+
      '<label>Unit<input name="unit" maxlength="40" required readonly value="'+esc(item?.unit||'')+'"></label>'+
      '<label>Operational note (optional)<textarea name="note" rows="2" maxlength="500" placeholder="Reason and context for the recommendation"></textarea></label>'+
      '<p class="muted-copy">This records a BUSHO recommendation only. It does not submit an indent, purchase order or stock request to DPDMIS.</p>'+
      '<button class="btn btn-primary" type="submit" '+(busy||refreshRequired?'disabled':'')+'>Create replenishment recommendation</button></form>'
      :'<p class="empty-state">'+(verified.length?'No active inventory items are available in the verified report facility.':'No supervisor-verified reports are available in your authorised scope. Verify a report before creating a replenishment recommendation.')+'</p>')+'</article>';
    recommendation.querySelector('[name="sourceReportId"]')?.addEventListener('change',renderRecommendation);
    recommendation.querySelector('[name="inventoryItemId"]')?.addEventListener('change',e=>{const selected=items.find(i=>i.id===e.target.value);const unit=recommendation.querySelector('[name="unit"]');if(unit)unit.value=selected?.unit||'';});
  }
  async function recommend(form){
    if(busy||!client||refreshRequired||activeRole!=='supervisor')return;
    const data=new FormData(form),report=reports.find(r=>r.id===String(data.get('sourceReportId')||'')),item=inventory.find(i=>i.id===String(data.get('inventoryItemId')||''));
    const quantity=Number(data.get('requestedQuantity')),onHand=Number(data.get('onHandQuantity')),unit=String(data.get('unit')||'').trim();
    if(!report||report.status!=='supervisor_verified'||!report.facility_id){error='Select a supervisor-verified report in your assigned scope.';render();return;}
    if(!item||item.facility_id!==report.facility_id||item.is_active===false){error='Select an active inventory item from the same facility as the source report.';render();return;}
    if(!Number.isSafeInteger(quantity)||quantity<=0||!Number.isFinite(onHand)||onHand<0||!unit||unit!==String(item.unit||'')){error='Enter a positive whole requested quantity and a non-negative on-hand quantity using the inventory item unit.';render();return;}
    busy=true;error='';notice='';refreshRequired=true;render();
    try{
      const created=await client.createReplenishmentRequest({facilityId:report.facility_id,inventoryItemId:item.id,requestedQuantity:quantity,sourceReportId:report.id,onHandQuantity:onHand,unit,note:String(data.get('note')||'').trim(),dataMode:'synthetic_demo'});
      if(!created?.id)throw new Error('The server did not confirm a replenishment request ID.');
      notice='Recommendation created. Review the new request in the approval queue.';
      const result=await client.listMyReplenishments();rows=Array.isArray(result)?result:[];refreshRequired=false;
    }catch(e){
      error=e?.message||'The recommendation could not be confirmed. Refresh the queue before retrying.';
      try{const result=await client.listMyReplenishments();rows=Array.isArray(result)?result:[];refreshRequired=false;}
      catch{error+=' The save outcome is uncertain; refresh before attempting another submission.';}
    }finally{busy=false;render();}
  }
  function render(){
    if(message) message.innerHTML=[
      error?'<p class="portal-login-error" role="alert">'+esc(error)+'</p>':'',
      notice?'<p class="storekeeper-notice" role="status">'+esc(notice)+'</p>':''
    ].join('');
    if(summary) summary.innerHTML=[['Requests in scope',rows.length],['Awaiting approval',rows.filter(r=>r.status==='recommended_to_facility_store').length],['Awaiting submission',rows.filter(r=>r.status==='supervisor_approved').length],['With storekeeper',rows.filter(r=>['submitted_to_dpdmis','allocated','dispatched','partially_received','received'].includes(r.status)).length]].map(([k,v])=>'<article class="supervisor-kpi"><span>'+esc(k)+'</span><strong>'+v+'</strong><small>Authenticated facility-scoped records</small></article>').join('');
    renderRecommendation();
    if(!list)return;
    if(busy&&!rows.length){list.innerHTML='<p class="empty-state">Loading supply handoff…</p>';return;}
    if(error&&!rows.length){list.innerHTML='<p class="empty-state">The supply handoff could not be loaded. Retry after checking the message above.</p>';return;}
    if(!rows.length){list.innerHTML='<article class="module-card"><h3>No replenishment handoffs</h3><p class="empty-state">No requests are currently visible within your assigned supervisor scope. This is not a statewide stock status.</p></article>';return;}
    list.innerHTML=rows.map(r=>{
      const item=r.inventory_items||{}, canApprove=!refreshRequired&&activeRole==='supervisor'&&r.status==='recommended_to_facility_store', canSubmit=!refreshRequired&&activeRole==='supervisor'&&r.status==='supervisor_approved';
      return '<article class="module-card storekeeper-request" data-handoff-id="'+esc(r.id)+'" data-recommendation-note="'+esc(r.note||'')+'"><div class="module-card-head"><div><p class="card-overline">'+esc(r.facilities?.name||'Assigned facility')+'</p><h3>'+esc(item.name||r.note||'Replenishment request')+'</h3><p>'+esc(r.requested_quantity)+' '+esc(r.unit||item.unit||'')+' requested · '+esc(r.on_hand_quantity??'—')+' reported on hand</p></div><span class="status-pill">'+esc(status(r.status))+'</span></div><dl class="storekeeper-facts"><div><dt>Source report</dt><dd>'+esc(r.source_report_id||'—')+'</dd></div><div><dt>Created</dt><dd>'+esc(date(r.created_at))+'</dd></div><div><dt>Supervisor decision</dt><dd>'+esc(r.reviewed_at_user?date(r.reviewed_at_user):'Not approved')+'</dd></div><div><dt>DPDMIS reference</dt><dd>'+esc(r.dpdmis_reference||'Not recorded')+'</dd></div><div><dt>Allocation reference</dt><dd>'+esc(r.allocation_reference||'Not recorded')+'</dd></div><div><dt>Dispatch reference</dt><dd>'+esc(r.dispatch_reference||'Not recorded')+'</dd></div><div><dt>Receipt progress</dt><dd>'+esc(r.received_quantity||0)+' / '+esc(r.requested_quantity)+' '+esc(r.unit||'')+'</dd></div><div><dt>Last update</dt><dd>'+esc(date(r.updated_at||r.created_at))+'</dd></div></dl>'+(canApprove?'<form class="handoff-action" data-action="approve"><label>Approval note (optional)<input name="note" maxlength="500" placeholder="Operational context"></label><button class="btn btn-primary" type="submit">Approve recommendation</button></form>':'')+(canSubmit?'<form class="handoff-action" data-action="submit"><label>External DPDMIS submission reference<input name="reference" required maxlength="120" placeholder="Enter reference after external submission"></label><button class="btn btn-primary" type="submit">Record submission reference</button></form>':'')+'<p class="muted-copy">Storekeeper handoff: '+(r.status==='submitted_to_dpdmis'?'Request is available to an assigned storekeeper.':(['allocated','dispatched','partially_received','received'].includes(r.status)?'Storekeeper has recorded progress.':'Not yet handed off.'))+'</p></article>';
    }).join('');
  }
  async function load() {
    if (!client || busy) return;
    busy = true;
    error = '';
    notice = '';
    render();

    try {
      const [requestRows, reportRows, itemRows] = await Promise.all([
        client.listMyReplenishments(), client.listSupervisorReports(), client.listInventory()
      ]);
      rows = Array.isArray(requestRows) ? requestRows : [];
      reports = Array.isArray(reportRows) ? reportRows : [];
      inventory = Array.isArray(itemRows) ? itemRows : [];
      refreshRequired = false;
    } catch (e) {
      error = e?.message || 'Unable to load requests.';
      if (!refreshRequired) { rows = []; reports = []; inventory = []; }
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

  recommendation?.addEventListener('submit',e=>{const f=e.target.closest('#supply-recommendation-form');if(!f)return;e.preventDefault();recommend(f);});
  list?.addEventListener('submit',e=>{const f=e.target.closest('form.handoff-action');if(!f)return;e.preventDefault();act(f);});
  refresh?.addEventListener('click',load);
  document.querySelector('[data-portal-view="supply-handoff"]')?.addEventListener('click',load);
  document.addEventListener('busho:authenticated',e=>{const p=e.detail?.profile;if(!p?.id||!['supervisor','district_admin','state_admin'].includes(p.role))return;try{activeRole=p.role;client=window.BUSHO_SUPABASE_CLIENT.createClient(window.BUSHO_SUPABASE_CONFIG);load();}catch(err){error=err.message||'Secure handoff unavailable.';render();}});
  document.addEventListener('busho:unauthenticated',()=>{client=null;activeRole=null;rows=[];reports=[];inventory=[];busy=false;error='';notice='';refreshRequired=false;render();});
})();
