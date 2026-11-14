(function (root) {
  'use strict';
  const page = root.document?.querySelector('[data-portal-role="worker"]');
  if (!page) return;
  let client = null;
  let profile = null;
  let active = false;
  let busy = false;
  let context = null;
  let cases = [];
  let generation = 0;

  const $ = selector => page.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
  const labels = {
    draft:'Draft', submitted_to_phc:'Sent to PHC', acknowledged_by_phc:'Acknowledged by PHC',
    under_phc_review:'Under PHC review', clarification_requested:'Clarification requested',
    resubmitted:'Resubmitted to PHC', accepted_for_phc_action:'Accepted for PHC action',
    phc_cannot_fulfil:'PHC cannot fulfil', official_indent_submitted:'External indent reference recorded',
    upstream_supply_received_at_phc:'Upstream supply received at PHC',
    phc_handover_recorded:'PHC handover recorded', collected_by_shc:'Collected by SHC',
    partially_received_at_shc:'Partially received at SHC', discrepancy_recorded:'Discrepancy recorded', received_at_shc:'Received at SHC',
    closed:'Closed', cancelled:'Cancelled'
  };
  const date = value => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
  };
  function feedback(message, isError) {
    const node = $('#stockout-create-feedback');
    if (node) { node.textContent = message || ''; node.classList.toggle('is-error', Boolean(isError)); }
  }
  function renderContext() {
    const node = $('#stockout-context');
    if (!node) return;
    if (!context?.worker) {
      node.innerHTML = '<p class="stockout-warning">Your active worker record could not be loaded. Check your account and facility assignment.</p>';
      return;
    }
    const facility = context.worker.facilities || {};
    const parent = context.phc;
    node.innerHTML = '<div class="stockout-context-grid"><div><small>ASSIGNED SHC</small><strong>' +
      esc(facility.name || 'Assigned SHC') + '</strong><span>' + esc(facility.district || '') +
      '</span></div><div><small>VERIFIED PARENT PHC</small><strong>' +
      esc(parent?.name || 'Not linked') + '</strong><span>' +
      (parent ? 'Verified facility relationship' : 'Contact the facility registry administrator') +
      '</span></div></div>' + (!parent ? '<p class="stockout-warning">A current verified SHC-to-PHC relationship is required. BUSHO will not infer your parent PHC from district or block.</p>' : '');
    const form = $('#stockout-create-form');
    const submit = $('#stockout-submit');
    if (form) form.hidden = !parent;
    if (submit) submit.disabled = !parent || busy;
  }
  function caseActionForm(row) {
    if (row.status === 'phc_handover_recorded') {
      return '<form class="stockout-action-form" data-case-form="collect" data-case-id="' + esc(row.id) + '">' +
        '<label>Collection reference <input name="reference" required maxlength="120" placeholder="PHC issue / collection register ref"></label>' +
        '<button class="btn btn-secondary" type="submit">Confirm SHC collection</button></form>';
    }
    if (['collected_by_shc','partially_received_at_shc','discrepancy_recorded'].includes(row.status)) {
      return '<form class="stockout-action-form" data-case-form="receipt" data-case-id="' + esc(row.id) + '">' +
        '<label>Quantity physically received <input name="quantity" type="number" min="0.01" step="0.01" required value="' +
        esc(row.shc_received_quantity || '') + '"></label><label>Receipt reference <input name="reference" required maxlength="120" placeholder="SHC receipt / register ref"></label>' +
        '<label>Discrepancy note (optional) <input name="discrepancy" maxlength="500"></label>' +
        '<button class="btn btn-secondary" type="submit">Record physical receipt</button></form>';
    }
    if (row.status === 'clarification_requested') {
      return '<form class="stockout-action-form" data-case-form="resubmit" data-case-id="' + esc(row.id) + '">' +
        '<label>Updated note for PHC <textarea name="note" rows="2" maxlength="800" required placeholder="Answer the clarification request"></textarea></label>' +
        '<button class="btn btn-secondary" type="submit">Resubmit to PHC</button></form>';
    }
    return '';
  }
  function renderCases() {
    const node = $('#stockout-case-list');
    if (!node) return;
    if (!cases.length) {
      node.innerHTML = '<div class="empty-state">No stockout requests have been recorded for this account.</div>';
      return;
    }
    node.innerHTML = cases.map(row => {
      const events = Array.isArray(row.stockout_case_events) ? [...row.stockout_case_events].sort((a,b) => new Date(a.created_at)-new Date(b.created_at)) : [];
      const timeline = events.length ? '<ol class="stockout-timeline">' + events.map(event =>
        '<li><strong>' + esc((event.action || 'update').replaceAll('_',' ')) + '</strong><small>' +
        esc(date(event.created_at)) + '</small>' + (event.note ? '<p>' + esc(event.note) + '</p>' : '') +
        (event.external_reference ? '<small>Reference: ' + esc(event.external_reference) + '</small>' : '') + '</li>'
      ).join('') + '</ol>' : '<p class="muted-copy">No event history is available.</p>';
      return '<article class="stockout-case-card"><div class="stockout-case-head"><div><small>REQUEST · ' +
        esc(String(row.id).slice(0,8).toUpperCase()) + '</small><h4>' + esc(row.medicine_name) +
        '</h4><p>'+esc(row.medicine_strength_form||'Strength/form not recorded')+'</p></div><span class="stockout-status">' + esc(labels[row.status] || row.status) +
        '</span></div><div class="stockout-case-facts"><span>Observed: <b>' + esc(row.reported_quantity) + ' ' + esc(row.quantity_unit) +
        '</b></span><span>Requested: <b>' + esc(row.requested_quantity) + ' ' + esc(row.quantity_unit) +
        '</b></span><span>SHC received: <b>' + esc(row.shc_received_quantity || 0) + ' ' + esc(row.quantity_unit) +
        '</b></span><span>Reported: ' + esc(date(row.observed_at)) + '</span></div>' +
        (row.phc_review_note ? '<p class="stockout-review-note"><strong>PHC note:</strong> ' + esc(row.phc_review_note) + '</p>' : '') +
        (row.phc_handover_quantity !== null && row.phc_handover_quantity !== undefined ?
          '<p class="stockout-review-note">PHC handover recorded: <strong>' + esc(row.phc_handover_quantity) + ' ' + esc(row.quantity_unit) + '</strong></p>' : '') +
        caseActionForm(row) + '<details class="stockout-history"><summary>View activity history (' + events.length + ')</summary>' + timeline + '</details></article>';
    }).join('');
  }
  async function refresh() {
    const token = ++generation;
    const list = $('#stockout-case-list');
    if (list) list.innerHTML = '<div class="empty-state">Loading stockout requests…</div>';
    try {
      const [nextContext,nextCases] = await Promise.all([client.getMyStockoutContext(),client.listMyStockoutCases()]);
      if (token !== generation || !active) return;
      context = nextContext;
      cases = Array.isArray(nextCases) ? nextCases : [];
      renderContext();
      renderCases();
    } catch (error) {
      if (token !== generation || !active) return;
      if (list) list.innerHTML = '<div class="empty-state stockout-warning">' + esc(error.message || 'Could not load stockout requests.') + '</div>';
      const ctx = $('#stockout-context');
      if (ctx) ctx.innerHTML = '<p class="stockout-warning">' + esc(error.message || 'Could not load assigned facility context.') + '</p>';
    }
  }
  async function withBusy(action) {
    if (busy) return;
    busy = true;
    const submit = $('#stockout-submit');
    if (submit) submit.disabled = true;
    try { await action(); }
    catch (error) { feedback(error.message || 'The action could not be completed.', true); }
    finally {
      busy = false;
      if (submit) submit.disabled = !context?.phc;
    }
  }
  page.addEventListener('submit', event => {
    const form = event.target;
    if (form.id === 'stockout-create-form') {
      event.preventDefault();
      if (!client || !context?.phc) return;
      const data = new FormData(form);
      withBusy(async () => {
        await client.createStockoutCase({
          medicineName:data.get('medicineName'), medicineStrengthForm:data.get('medicineStrengthForm'), medicineSourceReference:data.get('medicineSourceReference'),
          reportedQuantity:data.get('reportedQuantity'), requestedQuantity:data.get('requestedQuantity'),
          quantityUnit:data.get('quantityUnit'), observationSource:data.get('observationSource'), note:data.get('note')
        });
        form.reset();
        const observed = $('#stockout-observed'); if (observed) observed.value = '0';
        feedback('Stockout request sent to your verified parent PHC. Keep the official register updated.', false);
        await refresh();
      });
      return;
    }
    if (!form.matches('[data-case-form]')) return;
    event.preventDefault();
    const data = new FormData(form);
    const id = form.dataset.caseId;
    withBusy(async () => {
      if (form.dataset.caseForm === 'collect') {
        await client.transitionMyStockoutCase({id,status:'collected_by_shc',shc_collection_reference:String(data.get('reference')).trim(),shc_collected_at:new Date().toISOString()});
      } else if (form.dataset.caseForm === 'receipt') {
        const row = cases.find(item => item.id === id);
        const qty = Number(data.get('quantity'));
        const handover = Number(row?.phc_handover_quantity);
        if (!Number.isFinite(qty) || qty <= Number(row?.shc_received_quantity || 0) || qty > handover) throw new Error('Receipt quantity must be greater than the previous receipt and no more than the PHC handover quantity.');
        const discrepancy=String(data.get('discrepancy')||'').trim();
        if(discrepancy && qty>=handover) throw new Error('A quantity discrepancy must be recorded against a partial receipt. If the full handover quantity arrived, record it as fully received.');
        const receipt={id,status:discrepancy?'discrepancy_recorded':(qty===handover?'received_at_shc':'partially_received_at_shc'),
          shc_received_quantity:qty,shc_receipt_reference:String(data.get('reference')).trim(),
          shc_received_at:new Date().toISOString()};
        if(discrepancy)receipt.discrepancy_note=discrepancy;
        await client.transitionMyStockoutCase(receipt);
      } else if (form.dataset.caseForm === 'resubmit') {
        await client.transitionMyStockoutCase({id,status:'resubmitted',worker_note:String(data.get('note')).trim()});
      }
      await refresh();
    });
  });
  $('#stockout-refresh')?.addEventListener('click', () => refresh());
  document.addEventListener('busho:authenticated', async event => {
    if (event.detail?.profile?.role !== 'worker') return;
    active = true;
    profile = event.detail.profile;
    const factory = root.BUSHO_SUPABASE_CLIENT;
    const config = root.BUSHO_SUPABASE_CONFIG;
    if (!factory || !config) return;
    try { client = factory.createClient(config); await refresh(); }
    catch (error) { const node=$('#stockout-context'); if(node) node.innerHTML='<p class="stockout-warning">'+esc(error.message)+'</p>'; }
  });
  document.addEventListener('busho:unauthenticated', () => {
    active = false; generation++; client = null; context = null; cases = []; profile = null;
    const list=$('#stockout-case-list'); if(list) list.innerHTML='<div class="empty-state">Sign in to view stockout requests.</div>';
  });
})(typeof window !== 'undefined' ? window : null);
