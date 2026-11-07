(() => {
  const form = document.getElementById('facility-import-form');
  if (!form) return;
  const status = document.getElementById('facility-import-status');
  const submit = document.getElementById('facility-import-submit');
  const reviewPanel = document.getElementById('facility-import-review');
  const list = document.getElementById('facility-candidate-list');
  const summary = document.getElementById('facility-batch-summary');
  const pageLabel = document.getElementById('facility-page-label');
  const previous = document.getElementById('facility-page-prev');
  const next = document.getElementById('facility-page-next');
  const complete = document.getElementById('facility-batch-complete');

  let client = null;
  let profile = null;
  let batchId = null;
  let currentPage = 0;
  let total = 0;
  let pageSize = 100;
  let pendingRows = [];
  let pendingOffset = 0;
  let busy = false;

  function setStatus(message, kind = '') {
    status.textContent = message;
    status.className = 'admin-status' + (kind ? ' ' + kind : '');
  }
  function field(id) { return document.getElementById(id); }
  function setBusy(value, label) {
    busy = value;
    submit.disabled = value;
    submit.textContent = label || (value ? 'Working…' : 'Validate and stage facility candidates');
  }

  function parseCsv(source) {
    const rows = [];
    let row = [], value = '', quoted = false;
    const text = String(source).replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { value += '"'; i += 1; }
        else if (ch === '"') quoted = false;
        else value += ch;
      } else if (ch === '"' && value.length === 0) quoted = true;
      else if (ch === ',') { row.push(value); value = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i += 1;
        row.push(value);
        if (row.some(v => v.trim())) rows.push(row);
        row = []; value = '';
      } else value += ch;
    }
    if (quoted) throw new Error('CSV contains an unterminated quoted field.');
    if (value.length || row.length) { row.push(value); if (row.some(v => v.trim())) rows.push(row); }
    if (!rows.length) throw new Error('The selected CSV is empty.');
    const headers = rows.shift().map(v => v.trim().toLowerCase());
    if (new Set(headers).size !== headers.length) throw new Error('CSV contains duplicate headers.');
    const required = ['external_registry_id','name','facility_type','district_lgd_code','block_lgd_code'];
    const missing = required.filter(v => !headers.includes(v));
    if (missing.length) throw new Error('CSV is missing columns: ' + missing.join(', '));
    return rows.map((values, index) => {
      const item = {};
      headers.forEach((header, i) => { item[header] = String(values[i] ?? '').trim(); });
      item.source_row = index + 2;
      item.state_lgd_code = '22';
      return item;
    });
  }

  async function readImportFile(file) {
    const text = await file.text();
    if (file.name.toLowerCase().endsWith('.json')) {
      const data = JSON.parse(text);
      if (data.ok !== true || !Array.isArray(data.records) || !data.records.length) {
        throw new Error('Validator JSON must have ok=true and at least one candidate. Fix all import errors and re-run the validator.');
      }
      const provenance = data.provenance || {};
      if (provenance.authority) field('facility-source-authority').value = provenance.authority;
      if (provenance.source_date) field('facility-source-date').value = provenance.source_date;
      if (provenance.source_url) field('facility-source-url').value = provenance.source_url;
      return data.records.map(row => ({
        external_registry_id: row.external_registry_id,
        name: row.name,
        state_lgd_code: row.state_lgd_code || '22',
        district_lgd_code: row.district_lgd_code,
        block_lgd_code: row.block_lgd_code || null,
        facility_type: row.facility_type,
        source_row: row.source_row
      }));
    }
    return parseCsv(text);
  }

  async function stagePendingRows() {
    while (pendingOffset < pendingRows.length) {
      const chunk = pendingRows.slice(pendingOffset, pendingOffset + 250);
      await client.manageFacilityRegistry({ action: 'stage_candidates', batchId, candidates: chunk });
      pendingOffset += chunk.length;
      setStatus('Staged ' + pendingOffset + ' of ' + pendingRows.length + ' candidates. Batch ID: ' + batchId, 'success');
    }
    pendingRows = [];
    pendingOffset = 0;
    setBusy(false);
    await loadBatch(0);
  }

  async function loadBatch(page = currentPage) {
    if (!client || !batchId) return;
    currentPage = Math.max(0, page);
    const result = await client.manageFacilityRegistry({ action: 'list_batch', batchId, page: currentPage });
    total = result.total || 0;
    pageSize = result.pageSize || 100;
    const batch = result.batch;
    summary.textContent = batch.source_authority + ' · ' + batch.source_date + ' · ' +
      batch.verified_rows + ' verified · ' + batch.rejected_rows + ' rejected · ' +
      (batch.received_rows - batch.verified_rows - batch.rejected_rows) + ' awaiting review · Batch ' + batch.id;
    pageLabel.textContent = 'Page ' + (currentPage + 1) + ' of ' + Math.max(1, Math.ceil(total / pageSize));
    previous.disabled = currentPage === 0;
    next.disabled = (currentPage + 1) * pageSize >= total;
    complete.disabled = batch.received_rows !== batch.expected_rows ||
      batch.verified_rows + batch.rejected_rows !== batch.received_rows || batch.status === 'completed';
    list.replaceChildren();
    result.candidates.forEach(candidate => list.append(renderCandidate(candidate)));
    reviewPanel.classList.remove('hidden');
  }

  function renderCandidate(candidate) {
    const card = document.createElement('article');
    card.className = 'admin-side-note';
    const title = document.createElement('strong');
    title.textContent = candidate.name + ' · ' + candidate.facility_type.replaceAll('_',' ');
    const meta = document.createElement('p');
    meta.textContent = 'Source ID ' + candidate.external_registry_id + ' · District LGD ' +
      candidate.district_lgd_code + ' · Block LGD ' + (candidate.block_lgd_code || 'not mapped') +
      ' · Source row ' + candidate.source_row;
    const state = document.createElement('p');
    state.textContent = 'Status: ' + candidate.verification_status.replaceAll('_',' ');
    if (candidate.review_flags?.length) {
      const flags = document.createElement('p');
      flags.className = 'admin-status error';
      flags.textContent = 'Verification blocked: ' + candidate.review_flags.join(', ') +
        '. Reconcile the source mapping or use a newer source snapshot before this candidate can be verified.';
      card.append(title, meta, state, flags);
    } else card.append(title, meta, state);

    if (candidate.verification_status === 'needs_review') {
      const note = document.createElement('textarea');
      note.rows = 2;
      note.maxLength = 1000;
      note.placeholder = 'Record what source evidence you checked (minimum 8 characters).';
      note.style.width = '100%';
      note.style.marginTop = '10px';
      note.style.padding = '10px';
      note.style.border = '1px solid #dce4ee';
      note.style.borderRadius = '9px';
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';
      actions.style.marginTop = '10px';
      const verify = document.createElement('button');
      verify.type = 'button';
      verify.textContent = 'Verify and add facility';
      verify.disabled = Boolean(candidate.review_flags?.length);
      const reject = document.createElement('button');
      reject.type = 'button';
      reject.textContent = 'Reject candidate';
      verify.addEventListener('click', () => reviewCandidate(candidate.id, 'verify', note.value, verify, reject));
      reject.addEventListener('click', () => reviewCandidate(candidate.id, 'reject', note.value, verify, reject));
      actions.append(verify, reject);
      card.append(note, actions);
    } else if (candidate.review_note) {
      const note = document.createElement('p');
      note.textContent = 'Review note: ' + candidate.review_note;
      card.append(note);
    }
    return card;
  }

  async function reviewCandidate(candidateId, decision, note, verify, reject) {
    if (busy) return;
    if (String(note).trim().length < 8) return setStatus('Add a meaningful source-review note of at least 8 characters.', 'error');
    busy = true;
    verify.disabled = true;
    reject.disabled = true;
    try {
      await client.manageFacilityRegistry({ action: 'review_candidate', candidateId, decision, reviewNote: note });
      setStatus(decision === 'verify' ? 'Facility verified and created. It is now eligible for scoped assignment.' : 'Candidate rejected and retained in the audit history.', 'success');
      await loadBatch(currentPage);
    } catch (error) {
      setStatus(error.message || 'Candidate review failed.', 'error');
      verify.disabled = false;
      reject.disabled = false;
    } finally { busy = false; }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !client || !profile) return;
    try {
      const file = field('facility-import-file').files?.[0];
      if (!file) throw new Error('Choose a facility export file first.');
      const rows = await readImportFile(file);
      if (!rows.length || rows.length > 10000) throw new Error('The import must contain between 1 and 10,000 rows.');
      const sourceAuthority = field('facility-source-authority').value.trim();
      const sourceDate = field('facility-source-date').value;
      const sourceUrl = field('facility-source-url').value.trim();
      if (!sourceAuthority || !sourceDate || !sourceUrl.startsWith('https://')) throw new Error('Provide source authority, date and HTTPS URL.');
      setBusy(true, 'Creating secure import batch…');
      const result = await client.manageFacilityRegistry({
        action: 'create_batch', sourceAuthority, sourceDate, sourceUrl, expectedRows: rows.length
      });
      batchId = result.batch.id;
      pendingRows = rows;
      pendingOffset = 0;
      setStatus('Import batch created. Staging ' + rows.length + ' candidates…');
      await stagePendingRows();
    } catch (error) {
      setBusy(false, pendingRows.length ? 'Resume staging remaining candidates' : 'Validate and stage facility candidates');
      setStatus((error.message || 'Facility import failed.') + (batchId ? ' Batch ID: ' + batchId + '. ' + (pendingRows.length ? 'Use the button to resume the remaining rows.' : '') : ''), 'error');
    }
  });

  previous.addEventListener('click', () => loadBatch(currentPage - 1).catch(error => setStatus(error.message,'error')));
  next.addEventListener('click', () => loadBatch(currentPage + 1).catch(error => setStatus(error.message,'error')));
  complete.addEventListener('click', async () => {
    if (!client || !batchId || busy) return;
    busy = true;
    complete.disabled = true;
    try {
      await client.manageFacilityRegistry({ action: 'complete_batch', batchId });
      setStatus('Import batch completed. All source rows have a recorded human decision.', 'success');
      await loadBatch(currentPage);
    } catch (error) {
      setStatus(error.message || 'Batch cannot be completed yet.', 'error');
    } finally { busy = false; }
  });

  document.addEventListener('busho:admin-ready', event => {
    client = event.detail?.client || null;
    profile = event.detail?.profile || null;
  });
  document.addEventListener('busho:admin-cleared', () => {
    client = null; profile = null; batchId = null; pendingRows = []; pendingOffset = 0;
    reviewPanel.classList.add('hidden');
    setStatus('');
  });
})();
