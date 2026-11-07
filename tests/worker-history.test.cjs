const test = require('node:test');
const assert = require('node:assert/strict');
const history = require('../worker-history.js');

function makeDocument() {
  const modules = new Map(
    ['overview','my-reports','pending','facility','profile'].map(name => [name, { innerHTML: '' }])
  );
  const selectors = new Map();
  return {
    modules,
    querySelector(selector) {
      const match = selector.match(/^\[data-module="([^"]+)"\]$/);
      if (match) return modules.get(match[1]) || null;
      return selectors.get(selector) || null;
    },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    addEventListener() {},
    removeEventListener() {}
  };
}

function sampleReports() {
  return [
    {
      id: 'r-1', worker_id: 'w-1', facility_id: 'f-1', status: 'correction_requested',
      original_text: '4 people with fever; 12 ORS packets left',
      reporting_date: '2026-11-07', created_at: '2026-11-07T07:00:00Z',
      review_note: 'Please verify the patient count and stock unit.',
      facilities: { name: 'Facility A', district: 'Balod', block_lgd_code: '1234' },
      report_items: [{ item_type: 'symptom_trend', display_label: 'Fever', quantity: 4, unit: 'patients', value_text: JSON.stringify({ source_phrase: '4 people with fever' }), requires_review: true }],
      report_events: [{ id: 'e-1', action: 'correction_requested', actor_role: 'supervisor', note: 'Please verify the patient count and stock unit.', created_at: '2026-11-07T08:00:00Z' }]
    },
    {
      id: 'r-2', worker_id: 'w-1', facility_id: 'f-1', status: 'submitted',
      original_text: 'Weekly aggregate update', created_at: '2026-11-06T07:00:00Z',
      facilities: { name: 'Facility A' }, report_items: [], report_events: []
    },
    {
      id: 'r-3', worker_id: 'w-1', facility_id: 'f-1', status: 'draft',
      original_text: 'Draft report', created_at: '2026-11-05T07:00:00Z',
      facilities: { name: 'Facility A' }, report_items: [], report_events: []
    }
  ];
}

test('worker summary separates awaiting supervisor, returned, draft and verified reports', () => {
  assert.deepEqual(history.summarize([
    { status: 'submitted' },
    { status: 'resubmitted' },
    { status: 'correction_requested' },
    { status: 'draft' },
    { status: 'supervisor_verified' },
    { status: 'closed' }
  ]), { total: 6, awaiting: 2, returned: 1, drafts: 1, verified: 2 });
});

test('worker report item detail preserves quantity, uncertainty and source phrase', () => {
  const detail = history.itemView({
    item_type: 'stock_observation',
    display_label: 'ORS',
    quantity: null,
    unit: null,
    value_text: JSON.stringify({ stock_status: 'Quantity not stated · clarify', source_phrase: 'ORS packets nearly finished' }),
    requires_review: true
  });
  assert.deepEqual(detail, {
    label: 'ORS',
    type: 'Stock observation',
    quantity: 'Quantity not stated',
    status: 'Quantity not stated · clarify',
    source: 'ORS packets nearly finished'
  });
});

test('worker history renders server-backed records, supervisor feedback and assigned facility context', async () => {
  const doc = makeDocument();
  const controller = history.createController({
    client: {
      async requireActiveProfile() {},
      async getMyWorker() {
        return { display_name: 'Worker A', preferred_language: 'hi', facility_id: 'f-1', facilities: { name: 'Facility A', district: 'Balod', block_lgd_code: '1234' } };
      },
      async listMyReports() { return sampleReports(); }
    },
    document: doc,
    profile: { id: 'auth-1', display_name: 'Worker A', preferred_language: 'hi', role: 'worker' }
  });
  await controller.load();
  assert.equal(controller.getState().reports.length, 3);
  assert.match(doc.modules.get('overview').innerHTML, /Reports saved/);
  assert.match(doc.modules.get('my-reports').innerHTML, /Facility A/);
  assert.match(doc.modules.get('pending').innerHTML, /Please verify the patient count and stock unit/);
  assert.match(doc.modules.get('facility').innerHTML, /Block LGD code 1234/);
  assert.match(doc.modules.get('profile').innerHTML, /Worker A/);
});

test('worker history uses honest empty states when there is no assignment or report history', async () => {
  const doc = makeDocument();
  const controller = history.createController({
    client: {
      async requireActiveProfile() {},
      async getMyWorker() { return null; },
      async listMyReports() { return []; }
    },
    document: doc,
    profile: { id: 'auth-pending', role: 'worker' }
  });
  await controller.load();
  assert.match(doc.modules.get('my-reports').innerHTML, /No reports match this filter/);
  assert.match(doc.modules.get('facility').innerHTML, /No active worker record/);
  assert.match(doc.modules.get('pending').innerHTML, /No drafts or correction requests/);
});

test('returned reports can be resumed through the authenticated report editor', async () => {
  const doc = makeDocument();
  const previous = globalThis.BUSHO_WORKER_REPORT_EDITOR;
  const opened = [];
  globalThis.BUSHO_WORKER_REPORT_EDITOR = { openReport: report => opened.push(report.id) };
  try {
    const controller = history.createController({
      client: {
        async requireActiveProfile() {},
        async getMyWorker() { return { facility_id: 'f-1' }; },
        async listMyReports() { return sampleReports(); }
      },
      document: doc,
      profile: { id: 'auth-1', role: 'worker' }
    });
    await controller.load();
    controller.resumeReport('r-1');
    assert.deepEqual(opened, ['r-1']);
    assert.equal(controller.resumeReport('r-2'), false);
  } finally {
    if (previous === undefined) delete globalThis.BUSHO_WORKER_REPORT_EDITOR;
    else globalThis.BUSHO_WORKER_REPORT_EDITOR = previous;
  }
});

test('worker history safely escapes report content before rendering', async () => {
  const doc = makeDocument();
  const rows = sampleReports();
  rows[0].original_text = '<script>alert(1)</script>';
  const controller = history.createController({
    client: {
      async requireActiveProfile() {},
      async getMyWorker() { return null; },
      async listMyReports() { return rows; }
    },
    document: doc,
    profile: { id: 'auth-1', role: 'worker' }
  });
  await controller.load();
  assert.doesNotMatch(doc.modules.get('my-reports').innerHTML, /<script>alert/);
  assert.match(doc.modules.get('my-reports').innerHTML, /&lt;script&gt;/);
});
