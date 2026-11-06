const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadWorkflow() {
  const values = new Map();
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const listeners = {};
  const window = {
    localStorage: storage,
    addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
    dispatchEvent() {},
    CustomEvent: class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } }
  };
  const context = { window, localStorage: storage, Date, Math, JSON, console };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'workflow-store.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'workflow-store.js' });
  return { workflow: window.BUSHO_WORKFLOW, storage, listeners };
}

test('worker submission creates a supervisor-review record and preserves the source note', () => {
  const { workflow } = loadWorkflow();
  const report = workflow.submitReport({
    rawText: 'Synthetic demo: ORS stock is 20 packets; request review.',
    workerName: 'Anita Verma',
    facilityId: 'demo-hwc-dhamtari',
    conditions: [{ label: 'Fever mentions', value: '6' }],
    medicines: [{ medicineId: 'ors', label: 'ORS packets', quantity: 20, unit: 'packets' }]
  });

  assert.equal(report.status, 'submitted');
  assert.match(report.id, /^BUSHO-DEMO-RPT-/);
  assert.equal(report.rawText, 'Synthetic demo: ORS stock is 20 packets; request review.');
  assert.equal(workflow.getReports().length, 1);
});

test('report review supports verify, correction and rejection with an audit event', () => {
  const { workflow } = loadWorkflow();
  const report = workflow.submitReport({ rawText: 'Synthetic field observation', facilityId: 'demo-hwc-dhamtari' });

  const verified = workflow.reviewReport(report.id, {
    decision: 'verify',
    actor: 'Supervisor demo',
    note: 'Source note and aggregate fields checked.'
  });
  assert.equal(verified.status, 'verified');

  const other = workflow.submitReport({ rawText: 'Second synthetic observation', facilityId: 'demo-hwc-dhamtari' });
  const correction = workflow.reviewReport(other.id, {
    decision: 'request_correction',
    actor: 'Supervisor demo',
    note: 'Clarify the quantity and unit.'
  });
  assert.equal(correction.status, 'needs_correction');

  const rejected = workflow.reviewReport(other.id, {
    decision: 'reject',
    actor: 'Supervisor demo',
    note: 'Duplicate demo entry.'
  });
  assert.equal(rejected.status, 'rejected');
  assert.ok(workflow.getAuditLog().some(entry => entry.action === 'report_rejected'));
});

test('an indent cannot be created until its linked report is verified', () => {
  const { workflow } = loadWorkflow();
  const report = workflow.submitReport({ rawText: 'Synthetic stock note', facilityId: 'demo-hwc-dhamtari' });

  assert.throws(() => workflow.createIndentDraft(report.id, {
    actor: 'Store demo',
    items: [{ medicineId: 'ors', requestedQuantity: 30, unit: 'packets' }]
  }), /verified/i);

  workflow.reviewReport(report.id, { decision: 'verify', actor: 'Supervisor demo', note: 'Checked.' });
  const indent = workflow.createIndentDraft(report.id, {
    actor: 'Store demo',
    items: [{ medicineId: 'ors', requestedQuantity: 30, unit: 'packets' }]
  });
  assert.equal(indent.status, 'draft');
  assert.equal(indent.reportId, report.id);
});

test('indent, warehouse issue, dispatch and receipt are separate guarded events', () => {
  const { workflow } = loadWorkflow();
  const report = workflow.submitReport({ rawText: 'Synthetic stock note', facilityId: 'demo-hwc-dhamtari' });
  workflow.reviewReport(report.id, { decision: 'verify', actor: 'Supervisor demo', note: 'Checked.' });
  const indent = workflow.createIndentDraft(report.id, {
    actor: 'Store demo',
    items: [{ medicineId: 'ors', requestedQuantity: 30, unit: 'packets' }]
  });

  assert.throws(() => workflow.recordDispatch(indent.id, {
    actor: 'Store demo',
    dispatchRef: 'DEMO-TRIP-1',
    dispatchDate: '2026-11-06'
  }), /warehouse issue/i);

  workflow.submitIndent(indent.id, { actor: 'Store demo' });
  workflow.recordWarehouseIssue(indent.id, {
    actor: 'Warehouse demo',
    issuedQuantity: 30,
    issueRef: 'DEMO-WH-ISSUE-1',
    issueDate: '2026-11-06'
  });
  workflow.recordDispatch(indent.id, {
    actor: 'Store demo',
    dispatchRef: 'DEMO-TRIP-1',
    dispatchDate: '2026-11-06',
    carrier: 'Demo dispatch'
  });

  assert.equal(workflow.getIndent(indent.id).status, 'in_transit');
  assert.equal(workflow.getInventory('demo-hwc-dhamtari', 'ors').quantityOnHand, 20);

  const receipt = workflow.recordReceipt(indent.id, {
    actor: 'Store demo',
    receivedQuantity: 30,
    receiptNumber: 'DEMO-RECEIPT-1',
    receiptDate: '2026-11-06',
    batchNumber: 'DEMO-ORS-2026-01',
    expiryDate: '2027-11-30',
    rack: 'Demo rack A'
  });

  assert.equal(receipt.quantity, 30);
  assert.equal(workflow.getIndent(indent.id).status, 'received');
  assert.equal(workflow.getInventory('demo-hwc-dhamtari', 'ors').quantityOnHand, 50);
  assert.ok(workflow.getAuditLog().some(entry => entry.action === 'facility_receipt_recorded'));
});

test('receipt quantity cannot exceed warehouse-issued quantity', () => {
  const { workflow } = loadWorkflow();
  const report = workflow.submitReport({ rawText: 'Synthetic stock note', facilityId: 'demo-hwc-dhamtari' });
  workflow.reviewReport(report.id, { decision: 'verify', actor: 'Supervisor demo', note: 'Checked.' });
  const indent = workflow.createIndentDraft(report.id, {
    actor: 'Store demo',
    items: [{ medicineId: 'ors', requestedQuantity: 10, unit: 'packets' }]
  });
  workflow.submitIndent(indent.id, { actor: 'Store demo' });
  workflow.recordWarehouseIssue(indent.id, {
    actor: 'Warehouse demo',
    issuedQuantity: 10,
    issueRef: 'DEMO-WH-ISSUE-2',
    issueDate: '2026-11-06'
  });
  workflow.recordDispatch(indent.id, {
    actor: 'Store demo',
    dispatchRef: 'DEMO-TRIP-2',
    dispatchDate: '2026-11-06'
  });

  assert.throws(() => workflow.recordReceipt(indent.id, {
    actor: 'Store demo',
    receivedQuantity: 11,
    receiptNumber: 'DEMO-RECEIPT-2',
    receiptDate: '2026-11-06',
    batchNumber: 'DEMO-ORS-2026-02',
    expiryDate: '2027-11-30',
    rack: 'Demo rack B'
  }), /issued/i);
});

test('consumption follows FEFO and cannot issue more than available stock', () => {
  const { workflow } = loadWorkflow();
  workflow.addDemoLot({
    facilityId: 'demo-hwc-dhamtari',
    medicineId: 'ors',
    batchNumber: 'DEMO-ORS-EARLY',
    quantity: 5,
    expiryDate: '2026-12-15'
  });
  workflow.addDemoLot({
    facilityId: 'demo-hwc-dhamtari',
    medicineId: 'ors',
    batchNumber: 'DEMO-ORS-LATE',
    quantity: 5,
    expiryDate: '2027-12-31'
  });

  const issue = workflow.recordConsumption({
    facilityId: 'demo-hwc-dhamtari',
    medicineId: 'ors',
    quantity: 7,
    actor: 'Store demo',
    issueTo: 'Demo OPD'
  });
  assert.deepEqual(Array.from(issue.allocations, row => [row.batchNumber, row.quantity]), [
    ['DEMO-ORS-EARLY', 5],
    ['DEMO-ORS-2026-OPEN', 2]
  ]);
  assert.throws(() => workflow.recordConsumption({
    facilityId: 'demo-hwc-dhamtari',
    medicineId: 'ors',
    quantity: 100,
    actor: 'Store demo',
    issueTo: 'Demo OPD'
  }), /available stock/i);
});
