(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BUSHO_WORKER_HISTORY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STATUS = Object.freeze({
    draft: 'Saved draft',
    submitted: 'Awaiting supervisor review',
    resubmitted: 'Resubmitted for review',
    supervisor_verified: 'Supervisor verified',
    correction_requested: 'Correction requested',
    escalated: 'Escalated for review',
    rejected: 'Not accepted',
    closed: 'Closed',
    needs_clarification: 'Needs clarification',
    awaiting_confirmation: 'Awaiting confirmation',
    confirmed: 'Confirmed',
    superseded: 'Superseded'
  });

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function statusLabel(status) {
    return STATUS[status] || 'Unknown status';
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
  }

  function summarize(reports) {
    const rows = Array.isArray(reports) ? reports : [];
    return {
      total: rows.length,
      awaiting: rows.filter(row => ['submitted','resubmitted','escalated'].includes(row.status)).length,
      returned: rows.filter(row => row.status === 'correction_requested').length,
      drafts: rows.filter(row => row.status === 'draft').length,
      verified: rows.filter(row => ['supervisor_verified','closed'].includes(row.status)).length
    };
  }

  function itemView(item) {
    let metadata = {};
    try { metadata = item.value_text ? JSON.parse(item.value_text) : {}; } catch {}
    return {
      label: item.display_label || 'Unlabelled observation',
      type: item.item_type === 'symptom_trend' ? 'Reported condition' :
        item.item_type === 'stock_observation' ? 'Stock observation' : item.item_type,
      quantity: item.quantity === null || item.quantity === undefined
        ? 'Quantity not stated' : String(item.quantity) + (item.unit ? ' ' + item.unit : ''),
      status: metadata.stock_status || metadata.count_status || (item.requires_review ? 'Needs review' : 'Reviewed'),
      source: metadata.source_phrase || metadata.mentioned_as || ''
    };
  }

  function createController(options) {
    options = options || {};
    const client = options.client;
    const doc = options.document;
    const profile = options.profile || {};
    if (!client || !doc) throw new Error('Worker history requires an authenticated client and document.');

    let reports = [];
    let worker = null;
    let selectedId = null;
    let query = '';
    let filter = 'all';
    let busy = false;
    let error = '';

    function visibleReports() {
      return reports.filter(report => {
        if (filter === 'action' && !['draft','correction_requested'].includes(report.status)) return false;
        if (filter === 'submitted' && !['submitted','resubmitted','supervisor_verified','closed','rejected','escalated'].includes(report.status)) return false;
        if (!query) return true;
        const haystack = [
          report.original_text,
          report.facilities?.name,
          report.id,
          ...(report.report_items || []).map(item => item.display_label)
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    function render() {
      const summary = summarize(reports);
      const selected = reports.find(report => report.id === selectedId) || null;
      const overview = doc.querySelector('[data-module="overview"]');
      const history = doc.querySelector('[data-module="my-reports"]');
      const pending = doc.querySelector('[data-module="pending"]');
      const facilityModule = doc.querySelector('[data-module="facility"]');
      const profileModule = doc.querySelector('[data-module="profile"]');

      if (overview) overview.innerHTML = renderOverview(summary);
      if (history) history.innerHTML = renderHistory(selected);
      if (pending) pending.innerHTML = renderPending();
      if (facilityModule) facilityModule.innerHTML = renderFacility();
      if (profileModule) profileModule.innerHTML = renderProfile();

      const facility = worker?.facilities || null;
      const name = facility?.name || 'Facility assignment pending';
      const location = facility
        ? [facility.district, facility.block_lgd_code ? 'Block LGD ' + facility.block_lgd_code : ''].filter(Boolean).join(' · ')
        : 'Your approved facility assignment will appear here.';
      const facilityName = doc.querySelector('.demo-context strong');
      const facilityLocation = doc.querySelector('.demo-context > span:last-child');
      if (facilityName) facilityName.textContent = name;
      if (facilityLocation) facilityLocation.textContent = location;

      const badge = doc.querySelector('.demo-badge');
      if (badge) {
        badge.textContent = 'ACCOUNT-SCOPED · LIVE DATA';
        badge.classList.remove('demo-badge');
        badge.classList.add('live-data-badge');
      }
      doc.querySelectorAll('.demo-sidebar-label').forEach(node => node.textContent = 'ACCOUNT-SCOPED · DATABASE');
      doc.querySelectorAll('.profile-trigger-copy strong,.profile-dropdown-head strong').forEach(node => {
        node.textContent = profile.display_name || worker?.display_name || 'Health worker';
      });
      doc.querySelectorAll('.profile-trigger-copy small').forEach(node => node.textContent = name);
    }

    function renderOverview(summary) {
      return `
        <div class="module-heading"><div><p class="section-kicker">YOUR FIELD WORKSPACE</p><h2>Your reporting activity</h2><p>Live status from reports linked to your authenticated worker account.</p></div><button class="btn btn-primary" data-go-view="new-report">＋ Create new report</button></div>
        <div class="worker-overview-metrics">
          <article class="overview-stat"><span>Reports saved</span><strong>${summary.total}</strong><small>Your account's report history</small></article>
          <article class="overview-stat"><span>Awaiting supervisor</span><strong>${summary.awaiting}</strong><small>Submitted or escalated</small></article>
          <article class="overview-stat"><span>Returned for correction</span><strong>${summary.returned}</strong><small>Action required</small></article>
        </div>
        <article class="module-card"><div class="module-card-head"><div><h3>Recent reports</h3><p>Server-backed records, not browser demo activity</p></div><button class="text-action" data-go-view="my-reports">View all reports →</button></div>
          ${reports.length ? reports.slice(0,4).map(report => `<div class="simple-row"><span><strong>${escapeHtml(report.facilities?.name || 'Assigned facility')}</strong><small>${escapeHtml((report.report_items || []).map(item => item.display_label).slice(0,2).join(', ') || 'Field report')}</small></span><span>${escapeHtml(formatDate(report.submitted_at || report.created_at))}</span><span><b class="status-pill">${escapeHtml(statusLabel(report.status))}</b></span></div>`).join('') : '<p class="empty-state">No reports are linked to this account yet. Start with a new field report when ready.</p>'}
        </article>`;
    }

    function renderHistory(selected) {
      const rows = visibleReports();
      return `
        <div class="module-heading"><div><p class="section-kicker">REPORT HISTORY</p><h2>My reports</h2><p>Track submissions, supervisor decisions and reports returned for correction.</p></div><button type="button" class="btn btn-quiet" data-refresh-worker-reports>${busy ? 'Refreshing…' : 'Refresh records'}</button></div>
        <article class="module-card">
          <div class="module-card-head"><div><h3>Your report records</h3><p>${rows.length} visible · ${reports.length} linked to your account</p></div>
            <div class="filter-chips" role="group" aria-label="Filter reports">
              <button type="button" class="filter-chip ${filter==='all'?'active':''}" data-worker-filter="all">All</button>
              <button type="button" class="filter-chip ${filter==='action'?'active':''}" data-worker-filter="action">Action required</button>
              <button type="button" class="filter-chip ${filter==='submitted'?'active':''}" data-worker-filter="submitted">Submitted</button>
            </div>
          </div>
          <label class="visually-hidden" for="worker-report-search">Search your reports</label>
          <input id="worker-report-search" type="search" placeholder="Search report ID, facility or observation…" value="${escapeHtml(query)}">
          ${error ? `<p class="portal-login-error" role="alert">${escapeHtml(error)}</p>` : ''}
          <div class="simple-table">
            <div class="simple-row simple-header"><span>REPORT / FACILITY</span><span>DATE</span><span>STATUS</span></div>
            ${rows.length ? rows.map(report => `<button type="button" class="simple-row worker-report-row" data-open-worker-report="${escapeHtml(report.id)}"><span><strong>${escapeHtml(report.facilities?.name || 'Assigned facility')}</strong><small>${escapeHtml((report.report_items || []).map(item => item.display_label).slice(0,2).join(', ') || 'Field report')}</small></span><span>${escapeHtml(formatDate(report.submitted_at || report.created_at))}</span><span><b class="status-pill">${escapeHtml(statusLabel(report.status))}</b></span></button>`).join('') : '<p class="empty-state">No reports match this filter. Refresh after submitting a report.</p>'}
          </div>
        </article>
        ${selected ? renderDetail(selected) : '<article class="module-card report-detail-placeholder"><h3>Select a report</h3><p>Open a record to see the supervisor response and its audit timeline.</p></article>'}`;
    }

    function renderDetail(report) {
      const items = Array.isArray(report.report_items) ? report.report_items : [];
      const events = Array.isArray(report.report_events) ? report.report_events.slice().sort((a,b) => new Date(a.created_at)-new Date(b.created_at)) : [];
      const canResume = ['draft','correction_requested'].includes(report.status);
      return `
        <article class="module-card report-detail">
          <div class="module-card-head"><div><p class="card-overline">REPORT DETAIL</p><h3>${escapeHtml(report.facilities?.name || 'Assigned facility')}</h3><p>Reference: <code>${escapeHtml(report.id)}</code></p></div><b class="status-pill">${escapeHtml(statusLabel(report.status))}</b></div>
          <section class="report-source"><h4>Original field report</h4><p>${escapeHtml(report.original_text || 'No original narrative was attached.')}</p></section>
          <section><h4>Structured observations</h4>
            ${items.length ? items.map(item => { const detail=itemView(item); return `<div class="report-observation"><div><strong>${escapeHtml(detail.label)}</strong><small>${escapeHtml(detail.type)} · ${escapeHtml(detail.status)}</small>${detail.source ? `<p>Source phrase: ${escapeHtml(detail.source)}</p>` : ''}</div><b>${escapeHtml(detail.quantity)}</b></div>`; }).join('') : '<p class="empty-state">No structured observations were attached.</p>'}
          </section>
          ${report.review_note ? `<section class="review-note"><h4>Supervisor feedback</h4><p>${escapeHtml(report.review_note)}</p></section>` : ''}
          <section><h4>Report timeline</h4>
            ${events.length ? `<ol class="report-timeline">${events.map(event => `<li><strong>${escapeHtml(String(event.action || 'event').replaceAll('_',' '))}</strong><small>${escapeHtml(formatDate(event.created_at))} · ${escapeHtml(event.actor_role || 'system')}</small>${event.note ? `<p>${escapeHtml(event.note)}</p>` : ''}</li>`).join('')}</ol>` : '<p class="empty-state">No workflow events are available yet.</p>'}
          </section>
          ${canResume ? `<button type="button" class="btn btn-primary" data-resume-worker-report="${escapeHtml(report.id)}">${report.status==='draft'?'Continue saved draft':'Review corrections and resubmit'}</button>` : ''}
        </article>`;
    }

    function renderPending() {
      const actionable = reports.filter(report => ['draft','correction_requested'].includes(report.status));
      return `<div class="module-heading"><div><p class="section-kicker">ACTION REQUIRED</p><h2>Pending reports</h2><p>Drafts and supervisor-returned reports that can be continued.</p></div><button class="btn btn-quiet" data-refresh-worker-reports>Refresh</button></div>
        <article class="module-card">${actionable.length ? actionable.map(report => `<div class="simple-row"><span><strong>${escapeHtml(report.facilities?.name || 'Assigned facility')}</strong><small>${escapeHtml(statusLabel(report.status))} · ${escapeHtml(formatDate(report.updated_at || report.created_at))}</small>${report.review_note ? `<small>Supervisor: ${escapeHtml(report.review_note)}</small>` : ''}</span><button type="button" class="text-action" data-resume-worker-report="${escapeHtml(report.id)}">Continue →</button></div>`).join('') : '<p class="empty-state">No drafts or correction requests need your attention.</p>'}</article>`;
    }

    function renderFacility() {
      const facility = worker?.facilities;
      if (!worker) return '<div class="module-heading"><div><p class="section-kicker">ASSIGNED LOCATION</p><h2>My facility</h2></div></div><article class="module-card"><p class="empty-state">No active worker record is linked to this account. Ask an authorised administrator to provision your worker profile and facility assignment.</p></article>';
      return `<div class="module-heading"><div><p class="section-kicker">ASSIGNED LOCATION</p><h2>My facility</h2><p>Loaded from your approved worker assignment.</p></div></div><article class="module-card"><h3>${escapeHtml(facility?.name || 'Facility name not available')}</h3><p>${escapeHtml(facility?.district || 'District not available')}</p><p class="muted-copy">${escapeHtml(facility?.block_lgd_code ? 'Block LGD code ' + facility.block_lgd_code : 'Block reference not available')}</p><p class="muted-copy">BUSHO does not infer or create facility assignments from the administrative directory.</p></article>`;
    }

    function renderProfile() {
      return `<div class="module-heading"><div><p class="section-kicker">ACCOUNT</p><h2>My profile</h2></div></div><article class="module-card"><p><strong>Account:</strong> ${escapeHtml(profile.display_name || worker?.display_name || 'Health worker')}</p><p><strong>Role:</strong> Health Worker</p><p><strong>Preferred language:</strong> ${escapeHtml(profile.preferred_language || worker?.preferred_language || '—')}</p><p><strong>Assigned facility:</strong> ${escapeHtml(worker?.facilities?.name || 'Pending assignment')}</p></article>`;
    }

    async function load() {
      if (busy) return;
      busy = true; error = ''; render();
      try {
        await client.requireActiveProfile(['worker']);
        const results = await Promise.all([client.getMyWorker(), client.listMyReports()]);
        worker = results[0];
        reports = Array.isArray(results[1]) ? results[1] : [];
        reports.sort((a,b) => new Date(b.submitted_at || b.created_at)-new Date(a.submitted_at || a.created_at));
        if (selectedId && !reports.some(report => report.id === selectedId)) selectedId = null;
      } catch (cause) {
        reports = [];
        worker = null;
        selectedId = null;
        error = cause.message || 'Unable to load your report history.';
      } finally {
        busy = false;
        render();
      }
    }

    function resumeReport(id) {
      const report = reports.find(row => row.id === id);
      if (!report) return;
      try {
        const editor = typeof globalThis !== 'undefined' ? globalThis.BUSHO_WORKER_REPORT_EDITOR : null;
        if (!editor || typeof editor.openReport !== 'function') throw new Error('The report editor is not ready. Refresh the page.');
        editor.openReport(report);
      } catch (cause) {
        error = cause.message || 'Unable to reopen this report.';
        render();
      }
    }

    function handleClick(event) {
      const target = event.target.closest('[data-open-worker-report],[data-resume-worker-report],[data-worker-filter],[data-refresh-worker-reports]');
      if (!target) return;
      if (target.hasAttribute('data-open-worker-report')) {
        selectedId = target.getAttribute('data-open-worker-report');
        doc.querySelector('[data-portal-view="my-reports"]')?.click();
        render();
      } else if (target.hasAttribute('data-resume-worker-report')) {
        resumeReport(target.getAttribute('data-resume-worker-report'));
      } else if (target.hasAttribute('data-worker-filter')) {
        filter = target.getAttribute('data-worker-filter');
        render();
      } else if (target.hasAttribute('data-refresh-worker-reports')) {
        load();
      }
    }

    function handleInput(event) {
      if (event.target.id !== 'worker-report-search') return;
      const position = event.target.selectionStart;
      query = event.target.value.trim().toLowerCase();
      render();
      const next = doc.getElementById('worker-report-search');
      next?.focus();
      try { next?.setSelectionRange(position, position); } catch {}
    }

    function start() {
      doc.addEventListener('click', handleClick);
      doc.addEventListener('input', handleInput);
      load();
    }

    function stop() {
      doc.removeEventListener('click', handleClick);
      doc.removeEventListener('input', handleInput);
    }

    return Object.freeze({ start, stop, load, resumeReport, getState: () => ({ reports: reports.slice(), worker, selectedId, filter, query, busy, error }) });
  }

  return Object.freeze({ createController, escapeHtml, statusLabel, summarize, itemView, formatDate });
});
