const test = require('node:test');
const assert = require('node:assert/strict');
const persistence = require('../report-persistence.js');

function sampleDraft() {
  return [
    {
      id: 'disease-table',
      rows: [
        { name: 'Fever', patients: '4', countStatus: 'Patient count · verify', sourcePhrase: '4 patients with fever' },
        { name: 'Diarrhoea', patients: '', countStatus: 'Not stated · clarify', sourcePhrase: 'diarrhoea cases reported' }
      ]
    },
    {
      id: 'medicine-table',
      rows: [
        { name: 'ORS', mentionedAs: 'ORS', quantity: '12', unit: 'packets', stockStatus: 'Remaining stock · verify', sourcePhrase: '12 ORS packets left' },
        { name: 'Iron / IFA', mentionedAs: 'iron', quantity: '', unit: '', stockStatus: 'Quantity not stated · clarify', sourcePhrase: 'iron tablets nearly finished', fuzzy: false }
      ]
    },
    { id: 'original-report', value: '4 patients with fever; 12 ORS packets left' }
  ];
}

test('maps extraction tables to the database item types and preserves review context', () => {
  const items = persistence.toDatabaseItems(sampleDraft());
  assert.equal(items.length, 4);
  assert.deepEqual(items.map(item => item.item_type), [
    'symptom_trend', 'symptom_trend', 'stock_observation', 'stock_observation'
  ]);
  assert.equal(items[0].quantity, 4);
  assert.equal(items[0].unit, 'patients');
  assert.equal(items[1].quantity, null);
  assert.equal(items[2].quantity, 12);
  assert.equal(items[2].unit, 'packets');
  assert.equal(items[3].quantity, null);
  assert.ok(items.every(item => item.requires_review === true));
  assert.ok(items.every(item => item.confidence === null));
  assert.equal(JSON.parse(items[2].value_text).source_phrase, '12 ORS packets left');
  assert.equal(JSON.parse(items[3].value_text).stock_status, 'Quantity not stated · clarify');
  assert.ok(items.every(item => !Object.hasOwn(item, 'original_text')));
});

test('summary records extraction version and separates condition from stock counts', () => {
  const summary = persistence.toReportSummary(sampleDraft());
  assert.deepEqual(summary, {
    extraction_version: 1,
    structured_item_count: 4,
    condition_count: 2,
    stock_observation_count: 2,
    review_required: true
  });
});

test('rejects unnamed structured rows and invalid or negative quantities', () => {
  const unnamed = sampleDraft();
  unnamed[0].rows[0].name = ' ';
  assert.throws(() => persistence.toDatabaseItems(unnamed), /condition needs a name/i);

  const invalid = sampleDraft();
  invalid[1].rows[0].quantity = 'many';
  assert.throws(() => persistence.toDatabaseItems(invalid), /non-negative number/i);

  const negative = sampleDraft();
  negative[0].rows[0].patients = '-1';
  assert.throws(() => persistence.toDatabaseItems(negative), /non-negative number/i);
});

test('persists report in order and saves the draft ID before item or submit requests', async () => {
  const calls = [];
  const client = {
    async createReportDraft(input) { calls.push(['create', input]); return { id: 'report-123', status: 'draft' }; },
    async replaceReportItems(id, items) { calls.push(['items', id, items]); },
    async submitReport(id) { calls.push(['submit', id]); return { id, status: 'submitted' }; }
  };
  const result = await persistence.persistConfirmedReport({
    client,
    originalText: '4 patients with fever; 12 ORS packets left',
    languageCode: 'hi',
    draft: sampleDraft(),
    onDraftCreated: async id => { calls.push(['persist-id', id]); }
  });
  assert.deepEqual(calls.map(call => call[0]), ['create', 'persist-id', 'items', 'submit']);
  assert.equal(calls[2][1], 'report-123');
  assert.equal(calls[2][2].length, 4);
  assert.equal(result.report.status, 'submitted');
  assert.equal(result.itemCount, 4);
});

test('resumes an existing editable draft without creating a duplicate report', async () => {
  const calls = [];
  const client = {
    async getReport(id) { calls.push(['get', id]); return { id, status: 'correction_requested' }; },
    async createReportDraft() { throw new Error('must not create a second report'); },
    async updateReportDraft(id, input) { calls.push(['update', id, input.originalText]); return { id, status: 'correction_requested' }; },
    async replaceReportItems(id, items) { calls.push(['items', id, items.length]); },
    async submitReport(id) { calls.push(['submit', id]); return { id, status: 'submitted' }; }
  };
  const result = await persistence.persistConfirmedReport({
    client,
    reportId: 'existing-report',
    originalText: '4 patients with fever',
    draft: sampleDraft()
  });
  assert.deepEqual(calls.map(call => call[0]), ['get', 'update', 'items', 'submit']);
  assert.equal(calls[1][2], '4 patients with fever');
  assert.equal(result.report.id, 'existing-report');
});

test('does not submit when draft item replacement fails', async () => {
  let submitted = false;
  const client = {
    async createReportDraft() { return { id: 'report-456', status: 'draft' }; },
    async replaceReportItems() { throw new Error('network interrupted'); },
    async submitReport() { submitted = true; return { id: 'report-456', status: 'submitted' }; }
  };
  await assert.rejects(
    persistence.persistConfirmedReport({
      client,
      originalText: '4 patients with fever',
      draft: sampleDraft(),
      onDraftCreated: async () => {}
    }),
    /network interrupted/
  );
  assert.equal(submitted, false);
});

test('does not create a new report when a supplied draft ID cannot be loaded', async () => {
  let created = false;
  const client = {
    async getReport() { return null; },
    async createReportDraft() { created = true; }
  };
  await assert.rejects(
    persistence.persistConfirmedReport({
      client,
      reportId: 'missing-report',
      originalText: 'field update',
      draft: []
    }),
    /could not be found/
  );
  assert.equal(created, false);
});

test('requires the server to confirm submission before returning success', async () => {
  const client = {
    async createReportDraft() { return { id: 'report-789', status: 'draft' }; },
    async replaceReportItems() {},
    async submitReport() { return null; }
  };
  await assert.rejects(
    persistence.persistConfirmedReport({
      client,
      originalText: 'field update',
      draft: [],
      onDraftCreated: async () => {}
    }),
    /submission was not confirmed/
  );
});

test('requires a durable draft-ID callback before creating a new report', async () => {
  let created = false;
  const client = {
    async createReportDraft() { created = true; return { id: 'orphan-risk' }; }
  };
  await assert.rejects(
    persistence.persistConfirmedReport({
      client,
      originalText: 'field update',
      draft: []
    }),
    /draft-ID persistence callback is required/
  );
  assert.equal(created, false);
});

test('reconciles a retry when the server already submitted the saved report', async () => {
  const calls = [];
  const client = {
    async getReport(id) { calls.push(['get', id]); return { id, status: 'submitted', report_items: [{ id: 'item-1' }] }; },
    async updateReportDraft() { calls.push(['update']); throw new Error('must not update a submitted report'); },
    async replaceReportItems() { calls.push(['replace']); throw new Error('must not replace submitted items'); },
    async submitReport() { calls.push(['submit']); throw new Error('must not resubmit'); }
  };
  const result = await persistence.persistConfirmedReport({
    client,
    reportId: 'submitted-report',
    originalText: 'field update',
    draft: sampleDraft()
  });
  assert.deepEqual(calls, [['get', 'submitted-report']]);
  assert.equal(result.alreadySubmitted, true);
  assert.equal(result.report.status, 'submitted');
});
