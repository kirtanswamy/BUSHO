(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BUSHO_SUPERVISOR_OPERATIONS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const REVIEW_ACTIONS = Object.freeze({
    submitted: ['supervisor_verified', 'correction_requested', 'escalated', 'rejected'],
    resubmitted: ['supervisor_verified', 'correction_requested', 'escalated', 'rejected'],
    escalated: ['supervisor_verified', 'correction_requested', 'rejected'],
    supervisor_verified: ['closed']
  });

  const LABELS = Object.freeze({
    draft: 'Draft',
    submitted: 'Awaiting review',
    resubmitted: 'Resubmitted',
    supervisor_verified: 'Verified',
    correction_requested: 'Correction requested',
    escalated: 'Escalated',
    rejected: 'Rejected',
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
    return LABELS[status] || 'Unknown status';
  }

  function reviewActions(status) {
    return (REVIEW_ACTIONS[status] || []).slice();
  }

  function summarizeReports(reports) {
    const rows = Array.isArray(reports) ? reports : [];
    return {
      total: rows.length,
      awaitingReview: rows.filter(row => ['submitted', 'resubmitted', 'escalated'].includes(row.status)).length,
      verified: rows.filter(row => ['supervisor_verified', 'closed'].includes(row.status)).length,
      corrections: rows.filter(row => row.status === 'correction_requested').length,
      rejected: rows.filter(row => row.status === 'rejected').length,
      facilities: new Set(rows.map(row => row.facility_id).filter(Boolean)).size,
      workers: new Set(rows.map(row => row.worker_id).filter(Boolean)).size
    };
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
  }

  function itemDescription(item) {
    const quantity = item.quantity === null || item.quantity === undefined
      ? 'Quantity not stated'
      : String(item.quantity) + (item.unit ? ' ' + item.unit : '');
    let context = {};
    try { context = item.value_text ? JSON.parse(item.value_text) : {}; } catch {}
    const status = context.stock_status || context.count_status || '';
    return {
      label: item.display_label || 'Unlabelled observation',
      quantity,
      type: item.item_type === 'symptom_trend' ? 'Reported symptom' :
        item.item_type === 'stock_observation' ? 'Stock observation' : item.item_type,
      status,
      sourcePhrase: context.source_phrase || context.mentioned_as || '',
      requiresReview: item.requires_review !== false
    };
  }

  function createController(options) {
    options = options || {};
    const client = options.client;
    const doc = options.document;
    const onState = typeof options.onState === 'function' ? options.onState : () => {};
    const role = options.role || 'supervisor';
    let reports = [];
    let selectedId = null;
    let filter = 'all';
    let query = '';
    let busy = false;
    let error = '';

    if (!client || !doc) throw new Error('Supervisor operations require an authenticated client and document.');

    function visibleReports() {
      return reports.filter(report => {
        const awaiting = ['submitted', 'resubmitted', 'escalated'].includes(report.status);
        if (filter === 'review' && !awaiting) return false;
        if (filter === 'reviewed' && !['supervisor_verified', 'closed', 'correction_requested', 'rejected'].includes(report.status)) return false;
        if (!query) return true;
        const haystack = [
          report.original_text,
          report.facilities?.name,
          report.facilities?.district,
          report.workers?.display_name,
          report.id,
          ...(report.report_items || []).map(item => item.display_label)
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    function renderShell() {
      const summary = summarizeReports(reports);
      const selected = reports.find(report => report.id === selectedId) || null;
      const overview = doc.querySelector('[data-module="overview"]');
      const inbox = doc.querySelector('[data-module="reports"]');
      const activity = doc.querySelector('[data-module="activity"]');
      const facilities = doc.querySelector('[data-module="facilities"]');
      const workers = doc.querySelector('[data-module="workers"]');
      const trends = doc.querySelector('[data-module="trends"]');
      const inventory = doc.querySelector('[data-module="inventory"]');
      const approvals = doc.querySelector('[data-module="approvals"]');

      if (overview) overview.innerHTML = renderOverview(summary);
      if (inbox) inbox.innerHTML = renderInbox(selected);
      if (activity) activity.innerHTML = renderActivity();
      if (facilities) facilities.innerHTML = renderFacilities();
      if (workers) workers.innerHTML = renderWorkers();
      if (trends) trends.innerHTML = renderUnavailable('Health trends', 'Trend analysis will appear when there is sufficient verified, time-stamped reporting data. A rise in mentions is not a diagnosis or outbreak determination.');
      if (inventory) inventory.innerHTML = renderUnavailable('Inventory', 'Inventory observations and reconciled stock snapshots are not yet connected to this supervisor workspace.');
      if (approvals) approvals.innerHTML = renderUnavailable('Administrative approvals', 'Replenishment recommendations are separate from report review. This workspace will show requests only after the authorised approval workflow is connected.');

      const reportCount = doc.querySelector('[data-portal-view="reports"] .sidebar-count');
      if (reportCount) reportCount.textContent = String(summary.awaitingReview);
      const approvalCount = doc.querySelector('[data-portal-view="approvals"] .sidebar-count');
      if (approvalCount) approvalCount.textContent = '0';

      const badge = doc.querySelector('.demo-badge');
      if (badge) {
        badge.textContent = 'LIVE DATA · ACCESS SCOPED';
        badge.classList.remove('demo-badge');
        badge.classList.add('live-data-badge');
      }
      doc.querySelectorAll('.demo-sidebar-label').forEach(node => node.textContent = 'LIVE · DATABASE CONTROLLED');
      doc.querySelectorAll('.demo-data-disclaimer').forEach(node => node.remove());
      doc.querySelectorAll('.profile-trigger-copy strong').forEach(node => node.textContent = 'Supervisor workspace');
      doc.querySelectorAll('.profile-trigger-copy small').forEach(node => node.textContent = summary.facilities + ' assigned facilities in report data');
      onState({ reports, summary, selected, busy, error });
    }

    function renderOverview(summary) {
      const queue = reports.filter(row => ['submitted', 'resubmitted', 'escalated'].includes(row.status)).slice(0, 5);
      const recent = reports.slice(0, 6);
      const facilityCounts = new Map();
      for (const report of reports) {
        const name = report.facilities?.name || 'Assigned facility';
        facilityCounts.set(name, (facilityCounts.get(name) || 0) + 1);
      }
      return `
        <div class="module-heading"><div><p class="section-kicker">SUPERVISOR OPERATIONS</p><h2>Operational overview</h2><p>Live reports visible within your approved facility scope.</p></div><span class="scope-label">${escapeHtml(role.replaceAll('_',' '))} · RLS-scoped</span></div>
        <div class="supervisor-kpi-grid">
          ${kpi('Reports in scope', summary.total, 'Records visible to this account')}
          ${kpi('Awaiting review', summary.awaitingReview, 'Submitted, resubmitted or escalated')}
          ${kpi('Verified / closed', summary.verified, 'Supervisor-reviewed records')}
          ${kpi('Facilities represented', summary.facilities, 'Facilities with report activity')}
        </div>
        <div class="supervisor-overview-grid">
          <article class="module-card overview-wide"><div class="module-card-head"><div><p class="card-overline">ACTION QUEUE</p><h3>Reports needing attention</h3><p>Only records returned by the authorised database query are shown.</p></div><button class="text-action" data-open-inbox>Open inbox →</button></div>
            ${queue.length ? queue.map(report => `<button class="priority-row" data-open-report="${escapeHtml(report.id)}"><span class="priority-icon priority-amber">!</span><span><strong>${escapeHtml(report.facilities?.name || 'Assigned facility')} · ${escapeHtml(report.workers?.display_name || 'Health worker')}</strong><small>${escapeHtml(statusLabel(report.status))} · ${escapeHtml(formatDate(report.submitted_at || report.created_at))}</small></span><b>Review →</b></button>`).join('') : '<p class="empty-state">No reports are currently awaiting review in the records visible to this account.</p>'}
          </article>
          <article class="module-card"><div class="module-card-head"><div><p class="card-overline">FACILITY ACTIVITY</p><h3>Reports by facility</h3></div></div>
            ${facilityCounts.size ? Array.from(facilityCounts.entries()).map(([name,count]) => `<div class="facility-progress"><div class="facility-progress-head"><strong>${escapeHtml(name)}</strong><span>${count} reports</span></div><div class="progress-track"><i style="width:${Math.min(100, summary.total ? count / summary.total * 100 : 0)}%"></i></div></div>`).join('') : '<p class="empty-state">No facility reports are available yet.</p>'}
          </article>
          <article class="module-card"><div class="module-card-head"><div><p class="card-overline">RECENT RECORDS</p><h3>Latest submissions</h3></div><button class="text-action" data-open-inbox>View all →</button></div>
            ${recent.length ? recent.map(report => `<div class="simple-row"><span>${escapeHtml(report.facilities?.name || 'Facility')}</span><span>${escapeHtml(formatDate(report.created_at))}</span><span><b class="status-pill">${escapeHtml(statusLabel(report.status))}</b></span></div>`).join('') : '<p class="empty-state">No reports have been submitted in this scope.</p>'}
          </article>
        </div>
        <p class="muted-copy">Counts are calculated from records returned by the authenticated, row-level-security-scoped query. They are not statewide totals.</p>`;
    }

    function kpi(label, value, note) {
      return `<article class="supervisor-kpi"><div class="kpi-top"><span>${escapeHtml(label)}</span></div><strong>${value}</strong><small>${escapeHtml(note)}</small></article>`;
    }

    function renderInbox(selected) {
      const rows = visibleReports();
      return `
        <div class="module-heading"><div><p class="section-kicker">REPORT MANAGEMENT</p><h2>Reports inbox</h2><p>Review submitted field reports, preserve the original narrative and record every decision.</p></div><button type="button" class="btn btn-quiet" data-refresh>${busy ? 'Refreshing…' : 'Refresh records'}</button></div>
        <article class="module-card">
          <div class="module-card-head"><div><h3>Incoming reports</h3><p>${rows.length} visible record(s) · ${reports.length} total in this authorised query</p></div>
            <div class="filter-chips" role="group" aria-label="Filter reports">
              <button type="button" class="filter-chip ${filter==='all'?'active':''}" data-filter="all">All</button>
              <button type="button" class="filter-chip ${filter==='review'?'active':''}" data-filter="review">Needs review</button>
              <button type="button" class="filter-chip ${filter==='reviewed'?'active':''}" data-filter="reviewed">Reviewed</button>
            </div>
          </div>
          <label class="visually-hidden" for="supervisor-report-search">Search reports</label>
          <input id="supervisor-report-search" type="search" placeholder="Search facility, worker, report ID or observation…" value="${escapeHtml(query)}">
          ${error ? `<p class="portal-login-error" role="alert">${escapeHtml(error)}</p>` : ''}
          <div class="simple-table">
            <div class="simple-row simple-header"><span>REPORT / FACILITY</span><span>WORKER</span><span>STATUS</span><span>SUBMITTED</span></div>
            ${rows.length ? rows.map(report => `<button type="button" class="simple-row report-inbox-row" data-open-report="${escapeHtml(report.id)}"><span><strong>${escapeHtml(report.facilities?.name || 'Assigned facility')}</strong><small>${escapeHtml((report.report_items || []).map(item => item.display_label).slice(0,2).join(', ') || 'Field report')}</small></span><span>${escapeHtml(report.workers?.display_name || 'Health worker')}</span><span><b class="status-pill">${escapeHtml(statusLabel(report.status))}</b></span><span>${escapeHtml(formatDate(report.submitted_at || report.created_at))}</span></button>`).join('') : '<p class="empty-state">No records match this filter. New submissions will appear here after refresh.</p>'}
          </div>
        </article>
        ${selected ? renderDetail(selected) : '<article class="module-card report-detail-placeholder"><h3>Select a report to review</h3><p>Open a report to inspect its original field note, structured observations and audit history before deciding.</p></article>'}`;
    }

    function renderDetail(report) {
      const items = Array.isArray(report.report_items) ? report.report_items : [];
      const events = Array.isArray(report.report_events) ? report.report_events.slice().sort((a,b) => new Date(a.created_at)-new Date(b.created_at)) : [];
      const actions = role === 'supervisor' ? reviewActions(report.status) : [];
      return `
        <article class="module-card report-detail" id="supervisor-report-detail">
          <div class="module-card-head"><div><p class="card-overline">REPORT DETAIL</p><h3>${escapeHtml(report.facilities?.name || 'Assigned facility')}</h3><p>Reference: <code>${escapeHtml(report.id)}</code></p></div><b class="status-pill">${escapeHtml(statusLabel(report.status))}</b></div>
          <div class="report-meta-grid"><div><small>Health worker</small><strong>${escapeHtml(report.workers?.display_name || 'Health worker')}</strong></div><div><small>Reporting date</small><strong>${escapeHtml(report.reporting_date || '—')}</strong></div><div><small>Submitted</small><strong>${escapeHtml(formatDate(report.submitted_at || report.created_at))}</strong></div><div><small>Language</small><strong>${escapeHtml(report.language_code || '—')}</strong></div></div>
          <section class="report-source"><h4>Original field report</h4><p>${escapeHtml(report.original_text || 'No original narrative was attached.')}</p></section>
          <section><h4>Structured observations</h4>
            ${items.length ? items.map(item => { const detail=itemDescription(item); return `<div class="report-observation"><div><strong>${escapeHtml(detail.label)}</strong><small>${escapeHtml(detail.type)} · ${escapeHtml(detail.status || 'Human review required')}</small>${detail.sourcePhrase ? `<p>Source phrase: ${escapeHtml(detail.sourcePhrase)}</p>` : ''}</div><b>${escapeHtml(detail.quantity)}</b></div>`; }).join('') : '<p class="empty-state">No structured observations were attached to this report.</p>'}
          </section>
          ${report.review_note ? `<section class="review-note"><h4>Latest supervisor note</h4><p>${escapeHtml(report.review_note)}</p></section>` : ''}
          <section><h4>Audit timeline</h4>
            ${events.length ? `<ol class="report-timeline">${events.map(event => `<li><strong>${escapeHtml(event.action.replaceAll('_',' '))}</strong><small>${escapeHtml(formatDate(event.created_at))} · ${escapeHtml(event.actor_role || 'system')}</small>${event.note ? `<p>${escapeHtml(event.note)}</p>` : ''}</li>`).join('')}</ol>` : '<p class="empty-state">No workflow events are available for this report.</p>'}
          </section>
          ${actions.length ? `
            <form class="supervisor-review-form" data-review-form>
              <h4>Record review decision</h4>
              <label for="supervisor-decision">Decision</label>
              <select id="supervisor-decision" name="decision" required>${actions.map(action => `<option value="${action}">${escapeHtml(statusLabel(action))}</option>`).join('')}</select>
              <label for="supervisor-review-note">Review note <span class="muted-copy">(required for correction or escalation)</span></label>
              <textarea id="supervisor-review-note" name="note" rows="3" maxlength="1000" placeholder="Explain what needs attention or what was verified…"></textarea>
              <p class="muted-copy">The original worker narrative is immutable during supervisor review. Decisions are recorded in the database audit timeline.</p>
              <button class="btn btn-primary" type="submit" ${busy?'disabled':''}>${busy?'Saving decision…':'Save review decision'}</button>
              <p class="review-feedback" role="status" aria-live="polite"></p>
            </form>` : '<p class="empty-state">No further supervisor action is available for this report status.</p>'}
        </article>`;
    }

    function renderActivity() {
      const events = reports.flatMap(report => (report.report_events || []).map(event => ({...event, report})))
        .sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,60);
      return `<div class="module-heading"><div><p class="section-kicker">AUDIT TRAIL</p><h2>Activity log</h2><p>Workflow events recorded by the database for reports visible in your scope.</p></div><button class="btn btn-quiet" data-refresh>Refresh</button></div>
        <article class="module-card">${events.length ? events.map(event => `<div class="simple-row"><span>${escapeHtml(formatDate(event.created_at))}</span><span><strong>${escapeHtml(event.action.replaceAll('_',' '))}</strong><small>${escapeHtml(event.report.facilities?.name || 'Facility')} · ${escapeHtml(event.report.workers?.display_name || 'Worker')}</small></span><span>${escapeHtml(event.status_to || 'Recorded')}</span></div>`).join('') : '<p class="empty-state">No workflow events are available in the current report scope.</p>'}</article>`;
    }

    function renderFacilities() {
      const groups = new Map();
      for (const report of reports) {
        const facility = report.facilities || {};
        const key = report.facility_id || 'unknown';
        if (!groups.has(key)) groups.set(key, { name: facility.name || 'Assigned facility', district: facility.district || '', total: 0, pending: 0, workers: new Set() });
        const group = groups.get(key);
        group.total++;
        if (['submitted','resubmitted','escalated'].includes(report.status)) group.pending++;
        if (report.worker_id) group.workers.add(report.worker_id);
      }
      return `<div class="module-heading"><div><p class="section-kicker">COVERAGE</p><h2>Facilities in report activity</h2><p>Only facilities represented in reports returned by your assigned scope are listed.</p></div></div>
        <article class="module-card">${groups.size ? Array.from(groups.values()).map(f => `<div class="simple-row"><span><strong>${escapeHtml(f.name)}</strong><small>${escapeHtml(f.district)}</small></span><span>${f.total} reports</span><span>${f.workers.size} workers represented</span><span>${f.pending} awaiting review</span></div>`).join('') : '<p class="empty-state">No facility activity is available yet. Facility registry access is not inferred from the geography directory.</p>'}</article>`;
    }

    function renderWorkers() {
      const groups = new Map();
      for (const report of reports) {
        const worker = report.workers || {};
        const key = report.worker_id || 'unknown';
        if (!groups.has(key)) groups.set(key, { name: worker.display_name || 'Health worker', facility: report.facilities?.name || 'Assigned facility', reports: 0, last: null });
        const group = groups.get(key);
        group.reports++;
        const date = report.submitted_at || report.created_at;
        if (!group.last || new Date(date) > new Date(group.last)) group.last = date;
      }
      return `<div class="module-heading"><div><p class="section-kicker">TEAM ACTIVITY</p><h2>Workers represented in reports</h2><p>This is report activity, not an HR roster or attendance record.</p></div></div>
        <article class="module-card">${groups.size ? Array.from(groups.values()).map(w => `<div class="simple-row"><span><strong>${escapeHtml(w.name)}</strong><small>${escapeHtml(w.facility)}</small></span><span>${w.reports} reports</span><span>Latest: ${escapeHtml(formatDate(w.last))}</span></div>`).join('') : '<p class="empty-state">No worker activity is available yet.</p>'}</article>`;
    }

    function renderUnavailable(title, message) {
      return `<div class="module-heading"><div><p class="section-kicker">NOT CONNECTED</p><h2>${escapeHtml(title)}</h2></div></div><article class="module-card"><p class="empty-state">${escapeHtml(message)}</p></article>`;
    }

    async function load() {
      if (busy) return;
      busy = true; error = ''; renderShell();
      try {
        reports = await client.listSupervisorReports();
        if (!Array.isArray(reports)) throw new Error('The report inbox returned an unexpected response.');
        reports.sort((a,b) => new Date(b.submitted_at || b.created_at)-new Date(a.submitted_at || a.created_at));
        if (selectedId && !reports.some(report => report.id === selectedId)) selectedId = null;
      } catch (cause) {
        error = cause.message || 'Unable to load the supervisor report inbox.';
        reports = [];
        selectedId = null;
      } finally {
        busy = false;
        renderShell();
      }
    }

    async function decide(form) {
      if (busy) return;
      const report = reports.find(row => row.id === selectedId);
      if (!report) return;
      const data = new FormData(form);
      const decision = String(data.get('decision') || '');
      const note = String(data.get('note') || '').trim();
      if (['correction_requested','escalated'].includes(decision) && !note) {
        form.querySelector('.review-feedback').textContent = 'A reason is required for this decision.';
        return;
      }
      busy = true;
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      form.querySelector('.review-feedback').textContent = 'Saving the decision…';
      try {
        await client.reviewReport({ reportId: report.id, decision, note });
        busy = false;
        selectedId = report.id;
        await load();
      } catch (cause) {
        busy = false;
        form.querySelector('.review-feedback').textContent = cause.message || 'The decision could not be saved.';
        if (submit) submit.disabled = false;
      }
    }

    function handleClick(event) {
      const target = event.target.closest('[data-open-report],[data-filter],[data-refresh],[data-open-inbox]');
      if (!target) return;
      if (target.hasAttribute('data-open-report')) {
        selectedId = target.getAttribute('data-open-report');
        const inbox = doc.querySelector('[data-portal-view="reports"]');
        inbox?.click();
        renderShell();
        doc.getElementById('supervisor-report-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (target.hasAttribute('data-filter')) {
        filter = target.getAttribute('data-filter');
        renderShell();
      } else if (target.hasAttribute('data-refresh')) {
        load();
      } else if (target.hasAttribute('data-open-inbox')) {
        doc.querySelector('[data-portal-view="reports"]')?.click();
      }
    }

    function handleSubmit(event) {
      const form = event.target.closest('[data-review-form]');
      if (!form) return;
      event.preventDefault();
      decide(form);
    }

    function handleInput(event) {
      if (event.target.id !== 'supervisor-report-search') return;
      const start = event.target.selectionStart;
      query = event.target.value.trim().toLowerCase();
      renderShell();
      const next = doc.getElementById('supervisor-report-search');
      next?.focus();
      try { next?.setSelectionRange(start, start); } catch {}
    }

    function start() {
      doc.addEventListener('click', handleClick);
      doc.addEventListener('submit', handleSubmit);
      doc.addEventListener('input', handleInput);
      load();
    }

    function stop() {
      doc.removeEventListener('click', handleClick);
      doc.removeEventListener('submit', handleSubmit);
      doc.removeEventListener('input', handleInput);
    }

    return Object.freeze({ start, stop, load, getState: () => ({ reports: reports.slice(), selectedId, filter, query, busy, error }) });
  }

  return Object.freeze({ createController, escapeHtml, statusLabel, reviewActions, summarizeReports, itemDescription, formatDate });
});
