'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('../supabase-client.js');
const persistence = require('../report-persistence.js');

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    async json() { return payload; },
    async text() { return JSON.stringify(payload); }
  };
}

function sampleDraft() {
  return [
    {
      id: 'disease-table',
      rows: [{
        name: 'Fever',
        patients: '4',
        countStatus: 'Reported count · verify',
        sourcePhrase: 'four people with fever'
      }]
    },
    {
      id: 'medicine-table',
      rows: [{
        name: 'ORS',
        mentionedAs: 'ORS packets',
        quantity: '12',
        unit: 'packets',
        stockStatus: 'Remaining stock · verify',
        sourcePhrase: 'twelve ORS packets left'
      }]
    }
  ];
}

function makeServer() {
  const calls = [];
  const state = {
    report: null,
    items: [],
    reportCreates: 0,
    itemPosts: 0,
    submitAttempts: 0,
    failFirstSubmit: true
  };
  const worker = {
    id: 'synthetic-worker-row',
    auth_user_id: 'synthetic-worker-auth',
    facility_id: 'verified-facility-001',
    display_name: 'Synthetic Worker',
    preferred_language: 'hi',
    role: 'worker',
    is_active: true
  };

  const fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    const headers = options.headers || {};
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ url: String(url), method, headers, body });

    if (String(url).includes('/auth/v1/token?grant_type=password')) {
      return jsonResponse({
        access_token: 'synthetic-worker-access',
        refresh_token: 'synthetic-worker-refresh',
        expires_in: 3600,
        user: { id: worker.auth_user_id, email: 'worker@busho.test' }
      });
    }
    if (String(url).includes('/rest/v1/profiles?')) {
      return jsonResponse([{
        id: worker.auth_user_id,
        role: 'worker',
        status: 'active',
        display_name: worker.display_name
      }]);
    }
    if (String(url).includes('/rest/v1/workers?')) return jsonResponse([worker]);

    if (String(url).includes('/rest/v1/reports')) {
      if (method === 'POST') {
        state.reportCreates += 1;
        state.report = {
          id: 'synthetic-report-001',
          worker_id: worker.id,
          facility_id: worker.facility_id,
          original_text: body.original_text,
          language_code: body.language_code,
          summary: body.summary,
          status: 'draft'
        };
        return jsonResponse([state.report]);
      }
      if (method === 'GET') return jsonResponse(state.report ? [{ ...state.report, report_items: state.items }] : []);
      if (method === 'PATCH') {
        if (body.status === 'submitted') {
          state.submitAttempts += 1;
          if (state.failFirstSubmit) {
            state.failFirstSubmit = false;
            return jsonResponse({ message: 'temporary submit acknowledgement failure' }, 503);
          }
          state.report.status = 'submitted';
        } else {
          Object.assign(state.report, body);
        }
        return jsonResponse([{ ...state.report }]);
      }
    }

    if (String(url).includes('/rest/v1/report_items')) {
      if (method === 'DELETE') {
        state.items = [];
        return jsonResponse(null, 204);
      }
      if (method === 'POST') {
        state.itemPosts += 1;
        state.items = body;
        return jsonResponse(body);
      }
    }
    throw new Error('Unexpected REST request: ' + method + ' ' + url);
  };

  return { fetch, calls, state, worker };
}

test('worker report submission persists to the assigned facility and safely resumes after a lost submit acknowledgement', async () => {
  const server = makeServer();
  const storageValues = new Map();
  const storage = {
    getItem(key) { return storageValues.get(key) ?? null; },
    setItem(key, value) { storageValues.set(key, String(value)); },
    removeItem(key) { storageValues.delete(key); }
  };
  const client = createClient({
    url: 'https://synthetic-busho.supabase.co',
    publishableKey: 'sb_publishable_synthetic_test_key',
    fetch: server.fetch,
    storage,
    now: () => 1_800_000_000_000
  });
  await client.signInWithPassword({ email: 'worker@busho.test', password: 'synthetic-password' });

  let savedReportId = null;
  const input = {
    client,
    originalText: 'four people with fever; twelve ORS packets left',
    languageCode: 'hi',
    reportingDate: '2026-11-08',
    draft: sampleDraft(),
    onDraftCreated: async reportId => { savedReportId = reportId; }
  };

  await assert.rejects(
    persistence.persistConfirmedReport(input),
    /temporary submit acknowledgement failure/
  );
  assert.equal(savedReportId, 'synthetic-report-001');
  assert.equal(server.state.report.status, 'draft');
  assert.equal(server.state.reportCreates, 1);
  assert.equal(server.state.items.length, 2);

  const resumed = await persistence.persistConfirmedReport({
    ...input,
    reportId: savedReportId
  });
  assert.equal(resumed.report.status, 'submitted');
  assert.equal(resumed.report.id, savedReportId);
  assert.equal(resumed.itemCount, 2);
  assert.equal(server.state.reportCreates, 1, 'retry must not create a second report');
  assert.equal(server.state.itemPosts, 2, 'retry replaces the same draft item set');
  assert.equal(server.state.submitAttempts, 2);
  assert.equal(server.state.report.facility_id, server.worker.facility_id);
  assert.equal(server.state.report.worker_id, server.worker.id);
  assert.equal(server.state.report.original_text, input.originalText);

  const reportCreate = server.calls.find(call => call.method === 'POST' && call.url.includes('/rest/v1/reports'));
  assert.ok(reportCreate);
  assert.equal(reportCreate.headers.Authorization, 'Bearer synthetic-worker-access');
  assert.equal(reportCreate.body.facility_id, server.worker.facility_id);
  assert.equal(reportCreate.body.worker_id, server.worker.id);
  assert.equal(reportCreate.body.status, 'draft');

  const itemPost = server.calls.find(call => call.method === 'POST' && call.url.includes('/rest/v1/report_items'));
  assert.ok(itemPost);
  assert.ok(itemPost.body.every(item => item.report_id === savedReportId));
  assert.ok(itemPost.body.every(item => item.requires_review === true));
  assert.equal(JSON.parse(itemPost.body[1].value_text).source_phrase, 'twelve ORS packets left');
});
