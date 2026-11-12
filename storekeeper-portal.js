(() => {
  const page = document.querySelector('[data-portal-role="storekeeper"]');
  if (!page) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
  const date = value => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
  };
  const label = status => ({
    submitted_to_dpdmis:'Awaiting allocation',
    allocated:'Allocated · awaiting dispatch',
    dispatched:'Dispatched · awaiting receipt',
    partially_received:'Partially received',
    received:'Fully received'
  })[status] || String(status || 'Unknown').replaceAll('_',' ');
  let client = null;
  let rows = [];
  let busy = false;
  let error = '';
  let notice = '';
  let refreshRequired = false;

  const list = document.getElementById('storekeeper-requests');
  const summary = document.getElementById('storekeeper-summary');
  const message = document.getElementById('storekeeper-message');
  const refresh = document.getElementById('storekeeper-refresh');

  function showMessage() {
    if (!message) return;
    message.innerHTML = [
      error ? '<p class="portal-login-error" role="alert">' + esc(error) + '</p>' : '',
      notice ? '<p class="storekeeper-notice" role="status">' + esc(notice) + '</p>' : ''
    ].join('');
  }

  function render() {
    showMessage();
    const active = rows.filter(row => row.status !== 'received' && row.status !== 'rejected');
    if (summary) summary.innerHTML = [
      ['Requests in scope', rows.length],
      ['Awaiting allocation', rows.filter(r => r.status === 'submitted_to_dpdmis').length],
      ['Awaiting receipt', rows.filter(r => ['allocated','dispatched','partially_received'].includes(r.status)).length],
      ['Completed', rows.filter(r => r.status === 'received').length]
    ].map(([title,value]) => '<article class="supervisor-kpi"><span>' + esc(title) + '</span><strong>' + value + '</strong><small>Records returned by your assigned facility scope</small></article>').join('');

    if (!list) return;
    if (busy && !rows.length) {
      list.innerHTML = '<p class="empty-state">Loading assigned replenishment requests…</p>';
      return;
    }
    if (error && !rows.length) {
      list.innerHTML = '<p class="empty-state">Requests could not be loaded. Check the message above and retry.</p>';
      return;
    }
    if (!rows.length) {
      list.innerHTML = '<article class="module-card"><h3>No assigned requests</h3><p class="empty-state">No replenishment requests are currently visible to this storekeeper account. This is an empty scoped result, not a statewide stock status.</p></article>';
      return;
    }
    list.innerHTML = rows.map(row => {
      const item = row.inventory_items || {};
      const movements = Array.isArray(row.inventory_movements) ? row.inventory_movements : [];
      const events = Array.isArray(row.replenishment_events) ? row.replenishment_events : [];
      const canAllocate = !refreshRequired && row.status === 'submitted_to_dpdmis';
      const canDispatch = !refreshRequired && row.status === 'allocated';
      const canReceive = !refreshRequired && ['dispatched','partially_received'].includes(row.status);
      const remaining = Math.max(0, Number(row.requested_quantity || 0) - Number(row.received_quantity || 0));
      return '<article class="module-card storekeeper-request" data-request="' + esc(row.id) + '">' +
        '<div class="module-card-head"><div><p class="card-overline">' + esc(row.facilities?.name || 'Assigned facility') + '</p><h3>' + esc(item.name || row.note || 'Replenishment request') + '</h3><p>' + esc(row.requested_quantity) + ' ' + esc(row.unit || item.unit || '') + ' requested · ' + esc(row.on_hand_quantity ?? '—') + ' reported on hand</p></div><span class="status-pill">' + esc(label(row.status)) + '</span></div>' +
        '<dl class="storekeeper-facts"><div><dt>DPDMIS reference</dt><dd>' + esc(row.dpdmis_reference || 'Not recorded') + '</dd></div><div><dt>Allocation reference</dt><dd>' + esc(row.allocation_reference || 'Not recorded') + '</dd></div><div><dt>Dispatch / challan</dt><dd>' + esc(row.dispatch_reference || 'Not recorded') + '</dd></div><div><dt>Latest goods receipt reference</dt><dd>' + esc(row.receipt_reference || 'Not recorded') + '</dd></div><div><dt>Received to date</dt><dd>' + esc(row.received_quantity || 0) + ' / ' + esc(row.requested_quantity) + ' ' + esc(row.unit || '') + '</dd></div><div><dt>Outstanding quantity</dt><dd>' + esc(remaining) + ' ' + esc(row.unit || '') + '</dd></div><div><dt>Source report</dt><dd>' + esc(row.source_report_id || 'Not linked') + '</dd></div><div><dt>Data classification</dt><dd>' + esc(row.data_mode || 'Unspecified') + '</dd></div></dl>' +
        (canAllocate ? '<form class="storekeeper-action" data-action="allocate"><label>Allocation reference<input name="reference" required maxlength="120" placeholder="Enter external allocation reference"></label><button class="btn btn-primary" type="submit">Record allocation</button></form>' : '') +
        (canDispatch ? '<form class="storekeeper-action" data-action="dispatch"><label>Dispatch / challan reference<input name="reference" required maxlength="120" placeholder="Enter external challan reference"></label><button class="btn btn-primary" type="submit">Record dispatch</button></form>' : '') +
        (canReceive ? '<form class="storekeeper-action" data-action="receive"><label>Goods receipt reference<input name="reference" required maxlength="120" placeholder="Enter external GRN reference"></label><label>Total quantity received<input name="quantity" type="number" required min="' + esc(Number(row.received_quantity || 0) + 0.001) + '" max="' + esc(row.requested_quantity) + '" step="any" placeholder="Enter cumulative quantity received" value=""></label><small>Remaining to receive: ' + esc(remaining) + ' ' + esc(row.unit || '') + '. Enter cumulative quantity received, not just this delivery.</small><button class="btn btn-primary" type="submit">Record receipt</button></form>' : '') +
        '<details class="storekeeper-history"><summary>Movement & audit history (' + movements.length + ' movements · ' + events.length + ' events)</summary>' +
        (movements.length ? '<div class="simple-table"><div class="simple-row simple-header"><span>RECEIPT DELTA</span><span>EXTERNAL REFERENCE</span><span>RECORDED</span></div>' + movements.map(m => '<div class="simple-row"><span>+' + esc(m.quantity_delta) + ' ' + esc(m.unit) + '</span><span>' + esc(m.external_reference) + '</span><span>' + esc(date(m.created_at)) + '</span></div>').join('') + '</div><p class="muted-copy">Movement total: ' + esc(movements.reduce((sum,m) => sum + Number(m.quantity_delta || 0),0)) + ' ' + esc(row.unit || '') + ' · receipt total on request: ' + esc(row.received_quantity || 0) + ' ' + esc(row.unit || '') + '</p>' : '<p class="empty-state">No receipt movements recorded yet.</p>') +
        (events.length ? '<h4>Request event history</h4><ul>' + events.map(e => '<li>' + esc(e.action || 'Request updated') + ' · ' + esc(e.status_from || 'created') + ' → ' + esc(e.status_to || '') + ' · ' + esc(date(e.created_at)) + (e.external_reference ? ' · ' + esc(e.external_reference) : '') + '</li>').join('') + '</ul>' : '') +
        '</details></article>';
    }).join('');
  }

  async function load() {
    if (!client || busy) return;
    busy = true; error = ''; notice = ''; render();
    try {
      const result = await client.listMyReplenishments();
      rows = Array.isArray(result) ? result : [];
      refreshRequired = false;
    } catch (cause) {
      error = cause?.message || 'Unable to load replenishment requests.';
      if (!refreshRequired) rows = [];
    } finally {
      busy = false; render();
    }
  }

  async function submitAction(form) {
    if (busy || !client || refreshRequired) return;
    const card = form.closest('[data-request]');
    const id = card?.dataset.request;
    const row = rows.find(item => item.id === id);
    if (!row) return;

    const data = new FormData(form);
    const reference = String(data.get('reference') || '').trim();
    if (!reference) { error = 'An external reference is required.'; render(); return; }

    const action = form.dataset.action;
    const input = { id };

    if (action === 'allocate') {
      Object.assign(input, { status: 'allocated', allocationReference: reference });
    } else if (action === 'dispatch') {
      Object.assign(input, { status: 'dispatched', dispatchReference: reference });
    } else if (action === 'receive') {
      const quantity = Number(data.get('quantity'));
      if (!Number.isFinite(quantity) ||
          quantity <= Number(row.received_quantity || 0) ||
          quantity > Number(row.requested_quantity)) {
        error = 'Enter a cumulative receipt quantity greater than the previous total and no greater than the request.';
        render();
        return;
      }
      Object.assign(input, {
        status: quantity === Number(row.requested_quantity) ? 'received' : 'partially_received',
        receivedQuantity: quantity,
        receiptReference: reference
      });
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
    } catch (cause) {
      error = cause?.message ||
        'The update could not be confirmed. Refresh the request list before retrying.';
      busy = false;
      render();
      return;
    }

    notice = 'Update saved by the database.';
    try {
      const result = await client.listMyReplenishments();
      rows = Array.isArray(result) ? result : [];
      refreshRequired = false;
      notice = 'Update saved and the latest request list was refreshed.';
    } catch (cause) {
      error = 'The update was saved, but the request list could not be refreshed. Use Refresh before taking another action.';
    }

    busy = false;
    render();
  }

  list?.addEventListener('submit', event => {
    const form = event.target.closest('form.storekeeper-action');
    if (!form) return;
    event.preventDefault();
    submitAction(form);
  });
  refresh?.addEventListener('click', load);

  document.addEventListener('busho:authenticated', event => {
    const profile = event.detail?.profile;
    if (!profile?.id || profile.role !== 'storekeeper') return;
    try {
      client = window.BUSHO_SUPABASE_CLIENT.createClient(window.BUSHO_SUPABASE_CONFIG);
      const name = document.getElementById('storekeeper-name');
      if (name) name.textContent = profile.display_name || 'Storekeeper';
      load();
    } catch (cause) {
      error = cause?.message || 'Secure storekeeper workspace is unavailable.';
      render();
    }
  });
  document.addEventListener('busho:unauthenticated', () => {
    client = null; rows = []; busy = false; error = ''; notice = ''; refreshRequired = false; render();
  });
})();
