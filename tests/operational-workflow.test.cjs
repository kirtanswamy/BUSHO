const test = require('node:test');
const assert = require('node:assert/strict');
const workflow = require('../workflow-core.js');

test('a worker can submit a draft, but cannot verify their own report', () => {
  const report = { id: 'RPT-001', status: 'draft', events: [] };
  const submitted = workflow.transitionReport(report, {
    to: 'submitted', actorRole: 'worker', actorLabel: 'Demo CHO', at: '2026-11-06T10:00:00.000Z'
  });
  assert.equal(submitted.status, 'submitted');
  assert.equal(submitted.events.at(-1).action, 'worker_submitted');
  assert.throws(() => workflow.transitionReport(submitted, {
    to: 'supervisor_verified', actorRole: 'worker', actorLabel: 'Demo CHO'
  }), /not allowed/i);
});

test('a supervisor can return a report with a reason, then verify a resubmission', () => {
  const submitted = { id: 'RPT-002', status: 'submitted', events: [] };
  assert.throws(() => workflow.transitionReport(submitted, {
    to: 'correction_requested', actorRole: 'supervisor', actorLabel: 'Demo Supervisor', note: ''
  }), /reason/i);
  const returned = workflow.transitionReport(submitted, {
    to: 'correction_requested', actorRole: 'supervisor', actorLabel: 'Demo Supervisor',
    note: 'Please verify the reported ORS packet quantity.', at: '2026-11-06T10:01:00.000Z'
  });
  assert.equal(returned.status, 'correction_requested');
  const resubmitted = workflow.transitionReport(returned, {
    to: 'resubmitted', actorRole: 'worker', actorLabel: 'Demo CHO', note: 'Quantity rechecked.',
    at: '2026-11-06T10:02:00.000Z'
  });
  const verified = workflow.transitionReport(resubmitted, {
    to: 'supervisor_verified', actorRole: 'supervisor', actorLabel: 'Demo Supervisor',
    at: '2026-11-06T10:03:00.000Z'
  });
  assert.equal(verified.status, 'supervisor_verified');
  assert.equal(verified.events.length, 3);
});

test('verified report can create a facility indent recommendation, but not a purchase order', () => {
  const report = { id: 'RPT-003', status: 'submitted', facilityId: 'FAC-DHAMTARI-DEMO' };
  assert.throws(() => workflow.createIndent(report, {
    id: 'ors', name: 'ORS packets', requestedQty: 30, onHand: 20, unit: 'packets'
  }, { actorRole: 'supervisor', actorLabel: 'Demo Supervisor' }), /verified/i);
  const verified = { ...report, status: 'supervisor_verified' };
  const indent = workflow.createIndent(verified, {
    id: 'ors', name: 'ORS packets', requestedQty: 30, onHand: 20, unit: 'packets'
  }, { actorRole: 'supervisor', actorLabel: 'Demo Supervisor', at: '2026-11-06T10:04:00.000Z' });
  assert.equal(indent.status, 'recommended_to_facility_store');
  assert.equal(indent.requestedQty, 30);
  assert.equal(indent.purchaseOrderCreated, false);
});

test('supervisor approval/submission and storekeeper allocation/dispatch/receipt enforce separated roles', () => {
  const indent = {
    id: 'IND-001', status: 'recommended_to_facility_store', requestedQty: 30, receivedQty: 0,
    events: [], purchaseOrderCreated: false
  };
  assert.throws(() => workflow.transitionIndent(indent, {
    to: 'submitted_to_dpdmis', actorRole: 'supervisor', actorLabel: 'Demo Supervisor',
    reference: 'DEMO-DPDMIS-001'
  }), /not available/i);
  const approved = workflow.transitionIndent(indent, {
    to: 'supervisor_approved', actorRole: 'supervisor', actorLabel: 'Demo Supervisor',
    at: '2026-11-06T10:04:30.000Z'
  });
  assert.equal(approved.status, 'supervisor_approved');
  assert.throws(() => workflow.transitionIndent(approved, {
    to: 'submitted_to_dpdmis', actorRole: 'supervisor', actorLabel: 'Demo Supervisor'
  }), /reference/i);
  const submitted = workflow.transitionIndent(approved, {
    to: 'submitted_to_dpdmis', actorRole: 'supervisor', actorLabel: 'Demo Supervisor',
    reference: 'DEMO-DPDMIS-001', at: '2026-11-06T10:05:00.000Z'
  });
  assert.equal(submitted.status, 'submitted_to_dpdmis');

  assert.throws(() => workflow.transitionIndent(submitted, {
    to: 'allocated', actorRole: 'supervisor', actorLabel: 'Demo Supervisor',
    reference: 'DEMO-ALLOC-001'
  }), /not allowed/i);
  const allocated = workflow.transitionIndent(submitted, {
    to: 'allocated', actorRole: 'storekeeper', actorLabel: 'Demo Storekeeper',
    reference: 'DEMO-ALLOC-001', at: '2026-11-06T10:05:30.000Z'
  });
  assert.throws(() => workflow.transitionIndent(allocated, {
    to: 'dispatched', actorRole: 'supervisor', actorLabel: 'Demo Supervisor',
    reference: 'DEMO-CHALLAN-001'
  }), /not allowed/i);
  const dispatched = workflow.transitionIndent(allocated, {
    to: 'dispatched', actorRole: 'storekeeper', actorLabel: 'Demo Storekeeper',
    reference: 'DEMO-CHALLAN-001', at: '2026-11-06T10:06:00.000Z'
  });
  assert.throws(() => workflow.transitionIndent(dispatched, {
    to: 'received', actorRole: 'supervisor', actorLabel: 'Demo Supervisor',
    reference: 'DEMO-GRN-OVER', receivedQty: 31
  }), /not allowed/i);
  assert.throws(() => workflow.transitionIndent(dispatched, {
    to: 'received', actorRole: 'storekeeper', actorLabel: 'Demo Storekeeper',
    reference: 'DEMO-GRN-OVER', receivedQty: 31
  }), /exceed/i);
  const received = workflow.transitionIndent(dispatched, {
    to: 'received', actorRole: 'storekeeper', actorLabel: 'Demo Storekeeper',
    reference: 'DEMO-GRN-001', receivedQty: 30, at: '2026-11-06T10:07:00.000Z'
  });
  assert.equal(received.receivedQty, 30);
  assert.equal(received.status, 'received');
  assert.equal(received.purchaseOrderCreated, false);
});

test('indent can be partially received and then closed only when the balance is fulfilled', () => {
  const dispatched = {
    id: 'IND-002', status: 'dispatched', requestedQty: 30, receivedQty: 0,
    events: [], dispatchReference: 'DEMO-CHALLAN-002', purchaseOrderCreated: false
  };
  const partial = workflow.transitionIndent(dispatched, {
    to: 'partially_received', actorRole: 'storekeeper', actorLabel: 'Demo Storekeeper',
    reference: 'DEMO-GRN-002A', receivedQty: 12
  });
  assert.equal(partial.receivedQty, 12);
  assert.throws(() => workflow.transitionIndent(partial, {
    to: 'received', actorRole: 'storekeeper', actorLabel: 'Demo Storekeeper',
    reference: 'DEMO-GRN-002B', receivedQty: 0
  }), /positive/i);
  const complete = workflow.transitionIndent(partial, {
    to: 'received', actorRole: 'storekeeper', actorLabel: 'Demo Storekeeper',
    reference: 'DEMO-GRN-002B', receivedQty: 18
  });
  assert.equal(complete.receivedQty, 30);
  assert.equal(complete.status, 'received');
});

test('block-scoped summary excludes records from other LGD blocks and draft-only reports', () => {
  const records = [
    { blockCode: '3625', status: 'submitted' },
    { blockCode: '3625', status: 'supervisor_verified' },
    { blockCode: '3626', status: 'submitted' },
    { blockCode: '3625', status: 'draft' }
  ];
  assert.deepEqual(workflow.summarizeReports(records, '3625'), {
    submitted: 1, awaitingReview: 1, verified: 1, correctionRequested: 0, total: 2
  });
});
