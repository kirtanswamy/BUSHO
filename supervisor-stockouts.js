(() => {
  const page=document.querySelector('[data-portal-role="supervisor"]');
  if(!page)return;
  let client=null,active=false,busy=false,rows=[],generation=0;
  const $=s=>page.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const labels={submitted_to_phc:'New · awaiting acknowledgement',acknowledged_by_phc:'Acknowledged by PHC',under_phc_review:'Under PHC review',clarification_requested:'Clarification requested',resubmitted:'Resubmitted by SHC',accepted_for_phc_action:'Accepted for PHC action',phc_cannot_fulfil:'PHC cannot fulfil',official_indent_submitted:'External indent reference recorded',upstream_supply_received_at_phc:'Upstream supply received at PHC',phc_handover_recorded:'PHC handover recorded',collected_by_shc:'Collected by SHC',partially_received_at_shc:'Partially received at SHC',received_at_shc:'Received at SHC',closed:'Closed'};
  const date=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString();};
  function render(){
    const list=$('#phc-stockout-list'),summary=$('#phc-stockout-summary');
    if(!list)return;
    const activeRows=rows.filter(r=>!['closed','cancelled','received_at_shc'].includes(r.status));
    if(summary)summary.innerHTML='<div class="stockout-supervisor-metric"><strong>'+rows.length+'</strong><span>Total cases visible to your PHC</span></div><div class="stockout-supervisor-metric"><strong>'+activeRows.length+'</strong><span>Open cases</span></div><div class="stockout-supervisor-metric"><strong>'+rows.filter(r=>['submitted_to_phc','resubmitted'].includes(r.status)).length+'</strong><span>Awaiting PHC acknowledgement/review</span></div>';
    if(!rows.length){list.innerHTML='<div class="empty-state">No SHC stockout requests are currently visible in your assigned PHC scope.</div>';return;}
    list.innerHTML=rows.map(row=>{
      const events=Array.isArray(row.stockout_case_events)?[...row.stockout_case_events].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)):[];
      const reviewable=['submitted_to_phc','resubmitted','acknowledged_by_phc','under_phc_review'].includes(row.status);
      const canMarkUnavailable=Number(row.phc_available_quantity)===0&&Boolean(row.phc_available_observed_at);
      const reviewOptions=[['clarification_requested','Request clarification'],['accepted_for_phc_action','Accept for PHC stock action']];
      if(canMarkUnavailable)reviewOptions.push(['phc_cannot_fulfil','PHC cannot fulfil (storekeeper observed zero)']);
      const options=(row.status==='submitted_to_phc'||row.status==='resubmitted')
        ?[['acknowledged_by_phc','Acknowledge receipt'],['under_phc_review','Start PHC review'],...reviewOptions]
        :row.status==='acknowledged_by_phc'
        ?[['under_phc_review','Start PHC review'],...reviewOptions]
        :row.status==='under_phc_review'
        ?reviewOptions
        :[];
      const action=reviewable?'<form class="phc-stockout-review-form" data-case-id="'+esc(row.id)+'"><label>PHC decision<select name="status" required>'+options.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('')+'</select></label><p class="phc-stockout-feedback">Physical availability is recorded separately by the PHC storekeeper.</p><label>Review note / reason <textarea name="note" rows="2" maxlength="800" placeholder="Required for clarification or inability to fulfil"></textarea></label><button class="btn btn-primary" type="submit">Save PHC review</button><p class="phc-stockout-feedback" role="status" aria-live="polite"></p></form>':'';
      return '<article class="stockout-supervisor-case"><header><div><small>SHC REQUEST · '+esc(String(row.id).slice(0,8).toUpperCase())+'</small><h3>'+esc(row.medicine_name)+'</h3><p>'+esc(row.shc_facility_id)+' → This PHC</p></div><span class="stockout-status">'+esc(labels[row.status]||row.status)+'</span></header><div class="stockout-supervisor-facts"><span>Observed: <b>'+esc(row.reported_quantity)+' '+esc(row.quantity_unit)+'</b></span><span>Requested: <b>'+esc(row.requested_quantity)+' '+esc(row.quantity_unit)+'</b></span><span>Observation: '+esc(row.observation_source||'—')+'</span><span>Observed at: '+esc(date(row.observed_at))+'</span></div>'+(row.medicine_source_reference?'<p class="stockout-review-note">Source reference: '+esc(row.medicine_source_reference)+'</p>':'')+(row.worker_note?'<p class="stockout-review-note"><strong>SHC note:</strong> '+esc(row.worker_note)+'</p>':'')+(row.phc_available_quantity!==null&&row.phc_available_quantity!==undefined?'<p class="stockout-review-note">PHC physical availability observed by storekeeper: <strong>'+esc(row.phc_available_quantity)+' '+esc(row.quantity_unit)+'</strong> · '+esc(date(row.phc_available_observed_at))+' (observation only)</p>':'<p class="stockout-review-note">PHC physical availability has not yet been recorded by the storekeeper.</p>')+action+'<details class="stockout-history"><summary>Activity history ('+events.length+')</summary><ol class="stockout-timeline">'+events.map(e=>'<li><strong>'+esc((e.action||'update').replaceAll('_',' '))+'</strong><small>'+esc(date(e.created_at))+'</small>'+(e.note?'<p>'+esc(e.note)+'</p>':'')+(e.external_reference?'<small>Reference: '+esc(e.external_reference)+'</small>':'')+'</li>').join('')+'</ol></details></article>';
    }).join('');
  }
  async function refresh(){
    const token=++generation,list=$('#phc-stockout-list');
    if(list)list.innerHTML='<div class="empty-state">Loading PHC stockout requests…</div>';
    try{const result=await client.listPHCStockoutCases();if(token!==generation||!active)return;rows=Array.isArray(result)?result:[];render();}
    catch(e){if(token!==generation||!active)return;if(list)list.innerHTML='<div class="empty-state stockout-warning">'+esc(e.message||'Could not load PHC requests.')+'</div>';}
  }
  page.addEventListener('submit',event=>{
    const form=event.target.closest('.phc-stockout-review-form');if(!form)return;
    event.preventDefault();if(busy||!client)return;
    const data=new FormData(form),feedback=form.querySelector('.phc-stockout-feedback'),button=form.querySelector('button[type="submit"]');
    const status=String(data.get('status')||'');
    const note=String(data.get('note')||'').trim();
    if(['clarification_requested','phc_cannot_fulfil'].includes(status)&&!note){if(feedback)feedback.textContent='A reason is required for this decision.';return;}
    busy=true;button.disabled=true;if(feedback)feedback.textContent='Saving PHC review…';
    client.reviewPHCStockoutCase({id:form.dataset.caseId,status,note}).then(async()=>{await refresh();}).catch(e=>{if(feedback)feedback.textContent=e.message||'Review could not be saved.';}).finally(()=>{busy=false;button.disabled=false;});
  });
  $('#phc-stockout-refresh')?.addEventListener('click',()=>{if(client)refresh();});
  document.addEventListener('busho:authenticated',async event=>{
    if(event.detail?.profile?.role!=='supervisor')return;
    active=true;
    const factory=window.BUSHO_SUPABASE_CLIENT,config=window.BUSHO_SUPABASE_CONFIG;
    if(!factory||!config)return;
    try{client=factory.createClient(config);await refresh();}
    catch(e){const list=$('#phc-stockout-list');if(list)list.innerHTML='<div class="empty-state stockout-warning">'+esc(e.message)+'</div>';}
  });
  document.addEventListener('busho:unauthenticated',()=>{active=false;generation++;client=null;rows=[];const list=$('#phc-stockout-list');if(list)list.innerHTML='<div class="empty-state">Sign in to view PHC stockout requests.</div>';});
})();
