const test = require('node:test');
const assert = require('node:assert/strict');
const operations = require('../supervisor-operations.js');

test('supervisor review actions exactly follow the database report transition graph', () => {
  assert.deepEqual(operations.reviewActions('submitted'), [
    'supervisor_verified', 'correction_requested', 'escalated', 'rejected'
  ]);
  assert.deepEqual(operations.reviewActions('resubmitted'), operations.reviewActions('submitted'));
  assert.deepEqual(operations.reviewActions('escalated'), [
    'supervisor_verified', 'correction_requested', 'rejected'
  ]);
  assert.deepEqual(operations.reviewActions('supervisor_verified'), ['closed']);
  assert.deepEqual(operations.reviewActions('draft'), []);
  assert.deepEqual(operations.reviewActions('closed'), []);
});

test('report summary counts only the records supplied by the RLS-scoped query', () => {
  const result = operations.summarizeReports([
    { id: '1', status: 'submitted', facility_id: 'a', worker_id: 'w1' },
    { id: '2', status: 'resubmitted', facility_id: 'a', worker_id: 'w2' },
    { id: '3', status: 'supervisor_verified', facility_id: 'b', worker_id: 'w1' },
    { id: '4', status: 'closed', facility_id: 'b', worker_id: 'w1' },
    { id: '5', status: 'correction_requested', facility_id: 'b', worker_id: 'w3' },
    { id: '6', status: 'rejected', facility_id: 'b', worker_id: 'w3' }
  ]);
  assert.deepEqual(result, {
    total: 6,
    awaitingReview: 2,
    verified: 2,
    corrections: 1,
    rejected: 1,
    facilities: 2,
    workers: 3
  });
});

test('supervisor detail rendering helpers escape untrusted report content', () => {
  assert.equal(operations.escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(operations.statusLabel('submitted'), 'Awaiting review');
  assert.equal(operations.statusLabel('unknown_from_api'), 'Unknown status');
});

test('item detail preserves uncertainty and safely handles malformed metadata', () => {
  const result = operations.itemDescription({
    display_label: 'ORS',
    item_type: 'stock_observation',
    quantity: null,
    unit: null,
    value_text: '{not-json',
    requires_review: true
  });
  assert.deepEqual(result, {
    label: 'ORS',
    quantity: 'Quantity not stated',
    type: 'Stock observation',
    status: '',
    sourcePhrase: '',
    requiresReview: true
  });
});

test('item detail reads source phrase and review status without inventing a confidence value', () => {
  const result = operations.itemDescription({
    display_label: 'Fever',
    item_type: 'symptom_trend',
    quantity: 4,
    unit: 'patients',
    value_text: JSON.stringify({ source_phrase: '4 people with fever', count_status: 'Verify count' }),
    requires_review: true
  });
  assert.equal(result.quantity, '4 patients');
  assert.equal(result.sourcePhrase, '4 people with fever');
  assert.equal(result.status, 'Verify count');
  assert.equal(result.requiresReview, true);
  assert.equal(Object.hasOwn(result, 'confidence'), false);
});
