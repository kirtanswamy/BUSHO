import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const apiUrl = (process.env.API_URL || 'http://127.0.0.1:54321').replace(/\/$/, '');
const anonKey = process.env.ANON_KEY;
const serviceKey = process.env.SERVICE_ROLE_KEY;
if (!anonKey || !serviceKey) {
  throw new Error('Set API_URL, ANON_KEY and SERVICE_ROLE_KEY from supabase status --output env.');
}

const suffix = randomUUID().slice(0, 8);
const password = 'Local-BUSHO-E2E-' + randomUUID() + '!aA1';
const users = [];
const facilities = [];
const headers = key => ({ apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' });
async function request(path, { key = serviceKey, token = key, method = 'GET', body, prefer } = {}) {
  const response = await fetch(apiUrl + path, {
    method,
    headers: { apikey: key, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(method + ' ' + path + ' failed (' + response.status + '): ' + JSON.stringify(data));
  return data;
}
async function createUser(label) {
  const email = 'busho-e2e-' + label + '-' + suffix + '@example.test';
  const user = await request('/auth/v1/admin/users', { method: 'POST', body: {
    email, password, email_confirm: true, user_metadata: { full_name: 'Synthetic ' + label, preferred_language: 'en' }
  }});
  users.push(user.id);
  const login = await request('/auth/v1/token?grant_type=password', { key: anonKey, method: 'POST', body: { email, password }});
  assert.equal(login.user.id, user.id, 'password sign-in returns the created local user');
  return { id: user.id, token: login.access_token, email };
}
async function createFacility(label) {
  const rows = await request('/rest/v1/facilities?select=id,name', { method: 'POST', prefer: 'return=representation', body: [{
    name: 'SYNTHETIC E2E ' + label + ' ' + suffix, district: 'Balod', state: 'Chhattisgarh'
  }]});
  facilities.push(rows[0].id);
  return rows[0];
}
async function activate(user, role) {
  await request('/rest/v1/profiles?id=eq.' + user.id, { method: 'PATCH', body: { role, status: 'active' }});
}
async function assign(user, facility, role) {
  await request('/rest/v1/user_facility_assignments', { method: 'POST', body: [{
    user_id: user.id, facility_id: facility.id, assignment_role: role
  }]});
}
async function addWorker(user, facility, role) {
  const rows = await request('/rest/v1/workers?select=id', { method: 'POST', prefer: 'return=representation', body: [{
    facility_id: facility.id, display_name: 'Synthetic ' + role, role, is_active: true, auth_user_id: user.id
  }]});
  return rows[0].id;
}
async function scopedFacilities(user) {
  return request('/rest/v1/facilities?select=id,name&order=name', { key: anonKey, token: user.token });
}
async function scopedReports(user) {
  return request('/rest/v1/reports?select=id,facility_id,status&order=created_at', { key: anonKey, token: user.token });
}

try {
  const health = await fetch(apiUrl + '/auth/v1/health');
  assert.equal(health.ok, true, 'local Supabase Auth health endpoint responds');

  const facilityA = await createFacility('FACILITY-A');
  const facilityB = await createFacility('FACILITY-B');
  const workerA = await createUser('worker-a');
  const supervisorA = await createUser('supervisor-a');
  const workerB = await createUser('worker-b');
  const supervisorB = await createUser('supervisor-b');
  const storekeeperA = await createUser('storekeeper-a');
  const storekeeperB = await createUser('storekeeper-b');

  await Promise.all([
    activate(workerA, 'worker'), activate(supervisorA, 'supervisor'),
    activate(workerB, 'worker'), activate(supervisorB, 'supervisor'),
    activate(storekeeperA, 'storekeeper'), activate(storekeeperB, 'storekeeper')
  ]);
  await Promise.all([
    assign(workerA, facilityA, 'worker'), assign(supervisorA, facilityA, 'supervisor'),
    assign(workerB, facilityB, 'worker'), assign(supervisorB, facilityB, 'supervisor'),
    assign(storekeeperA, facilityA, 'storekeeper'), assign(storekeeperB, facilityB, 'storekeeper')
  ]);
  const [workerAId, workerBId] = await Promise.all([
    addWorker(workerA, facilityA, 'worker'), addWorker(workerB, facilityB, 'worker')
  ]);

  const [workerAFacilities, workerBFacilities, supervisorAFacilities, supervisorBFacilities] = await Promise.all([
    scopedFacilities(workerA), scopedFacilities(workerB), scopedFacilities(supervisorA), scopedFacilities(supervisorB)
  ]);
  assert.deepEqual(workerAFacilities.map(x => x.id), [facilityA.id], 'worker A sees only facility A');
  assert.deepEqual(workerBFacilities.map(x => x.id), [facilityB.id], 'worker B sees only facility B');
  assert.deepEqual(supervisorAFacilities.map(x => x.id), [facilityA.id], 'supervisor A sees only facility A');
  assert.deepEqual(supervisorBFacilities.map(x => x.id), [facilityB.id], 'supervisor B sees only facility B');

  const created = await request('/rest/v1/reports?select=id,facility_id,status', {
    key: anonKey, token: workerA.token, method: 'POST', prefer: 'return=representation', body: [{
      facility_id: facilityA.id, worker_id: workerAId, status: 'draft',
      reporting_date: new Date().toISOString().slice(0, 10),
      original_text: 'Synthetic E2E report ' + suffix + '; no patient information.',
      language_code: 'en', summary: { source: 'local_e2e_synthetic' }
    }]
  });
  assert.equal(created.length, 1, 'assigned worker can create a draft report');
  const report = created[0];
  assert.equal(report.facility_id, facilityA.id);

  const reportItemRows = await request('/rest/v1/report_items?select=id,report_id,item_type,display_label,quantity,unit,value_text', {
    key: anonKey, token: workerA.token, method: 'POST', prefer: 'return=representation',
    body: [{
      report_id: report.id,
      item_type: 'stock_observation',
      display_label: 'Synthetic stock observation before correction',
      quantity: 4,
      unit: 'packets',
      value_text: 'synthetic baseline',
      confidence: 0.9,
      requires_review: true
    }]
  });
  assert.equal(reportItemRows.length, 1, 'worker can add a structured item to their draft report');
  const reportItem = reportItemRows[0];

  const [workerADrafts, supervisorADrafts, supervisorBDrafts, workerBDrafts] = await Promise.all([
    scopedReports(workerA), scopedReports(supervisorA), scopedReports(supervisorB), scopedReports(workerB)
  ]);
  assert(workerADrafts.some(x => x.id === report.id && x.status === 'draft'), 'worker can read their own draft');
  assert(!supervisorADrafts.some(x => x.id === report.id), 'supervisor cannot read an unsubmitted worker draft');
  assert(!supervisorBDrafts.some(x => x.id === report.id), 'other-facility supervisor cannot read worker draft');
  assert(!workerBDrafts.some(x => x.id === report.id), 'other-facility worker cannot read worker draft');

  const submitted = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status', {
    key: anonKey, token: workerA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'submitted' }
  });
  assert.equal(submitted[0]?.status, 'submitted', 'worker can submit their own draft');

  const [supervisorASubmitted, supervisorBSubmitted, workerBSubmitted] = await Promise.all([
    scopedReports(supervisorA), scopedReports(supervisorB), scopedReports(workerB)
  ]);
  assert(supervisorASubmitted.some(x => x.id === report.id && x.status === 'submitted'),
    'same-facility supervisor can read a submitted worker report');
  assert(!supervisorBSubmitted.some(x => x.id === report.id), 'other-facility supervisor cannot read submitted report');
  assert(!workerBSubmitted.some(x => x.id === report.id), 'other-facility worker cannot read submitted report');
  // Negative authorization checks against the live local RLS/trigger path.
  const workerSelfVerify = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status', {
    key: anonKey, token: workerA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'supervisor_verified' }
  });
  assert.equal(workerSelfVerify.length, 0, 'worker cannot verify their own submitted report');
  const crossFacilityReview = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status', {
    key: anonKey, token: supervisorB.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'supervisor_verified' }
  });
  assert.equal(crossFacilityReview.length, 0, 'other-facility supervisor cannot review this report');

  const correctionRequested = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status,review_note', {
    key: anonKey, token: supervisorA.token, method: 'PATCH', prefer: 'return=representation',
    body: {
      status: 'correction_requested',
      review_note: 'Synthetic E2E correction reason: verify the stock observation.'
    }
  });
  assert.equal(correctionRequested[0]?.status, 'correction_requested',
    'assigned supervisor can request a report correction with a reason');

  const correctedItems = await request('/rest/v1/report_items?id=eq.' + reportItem.id + '&report_id=eq.' + report.id + '&select=id,display_label,quantity,value_text', {
    key: anonKey, token: workerA.token, method: 'PATCH', prefer: 'return=representation',
    body: {
      display_label: 'Synthetic stock observation corrected',
      quantity: 5,
      value_text: 'synthetic corrected observation'
    }
  });
  assert.equal(correctedItems[0]?.quantity, 5,
    'worker can correct structured report items after a correction request');
  assert.equal(correctedItems[0]?.display_label, 'Synthetic stock observation corrected',
    'corrected item label is persisted');

  const correctedReport = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status,original_text', {
    key: anonKey, token: workerA.token, method: 'PATCH', prefer: 'return=representation',
    body: {
      original_text: 'Synthetic E2E report ' + suffix + '; corrected synthetic stock observation; no patient information.',
      summary: { source: 'local_e2e_synthetic', correction: 'worker_resubmission' }
    }
  });
  assert.equal(correctedReport[0]?.status, 'correction_requested',
    'worker can update report content without changing its review status');

  const resubmitted = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status', {
    key: anonKey, token: workerA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'resubmitted' }
  });
  assert.equal(resubmitted[0]?.status, 'resubmitted',
    'worker can resubmit the corrected report');

  const correctionEvents = await request('/rest/v1/report_events?select=action,status_from,status_to,note,metadata&report_id=eq.' + report.id + '&order=created_at.asc', {
    key: anonKey, token: supervisorA.token
  });

  assert(correctionEvents.some(event =>
    event.status_to === 'correction_requested'
  ), 'report event history records the correction request');

  assert(correctionEvents.some(event =>
    event.status_to === 'resubmitted'
  ), 'report event history records worker resubmission');

  const itemCorrectionEvent = correctionEvents.find(event =>
    event.action === 'report_item_corrected' &&
    event.metadata?.report_item_id === reportItem.id
  );

  assert(itemCorrectionEvent, 'structured item correction creates an audit event');
  assert(
    Array.isArray(itemCorrectionEvent.metadata?.changed_fields) &&
    itemCorrectionEvent.metadata.changed_fields.includes('display_label') &&
    itemCorrectionEvent.metadata.changed_fields.includes('quantity'),
    'item correction audit event records changed field names'
  );

  const verified = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status', {
    key: anonKey, token: supervisorA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'supervisor_verified' }
  });
  assert.equal(verified[0]?.status, 'supervisor_verified',
    'assigned supervisor can verify the corrected and resubmitted report');
  const finalAReports = await scopedReports(supervisorA);
  assert(finalAReports.some(x => x.id === report.id && x.status === 'supervisor_verified'),
    'supervisor sees the verified report state');

  // Storekeeper fulfilment: all rows and users are synthetic and local-only.
  const inventoryRows = await request('/rest/v1/inventory_items?select=id,facility_id,item_code,name,unit,is_active', {
    method: 'POST', prefer: 'return=representation',
    body: [{
      facility_id: facilityA.id,
      item_code: 'E2E-ORS-' + suffix,
      name: 'Synthetic ORS packets ' + suffix,
      unit: 'packets',
      is_active: true
    }]
  });
  assert.equal(inventoryRows.length, 1, 'service role can seed one synthetic facility inventory catalogue item');
  const inventoryItem = inventoryRows[0];

  let storekeeperCreateDenied = false;
  try {
    await request('/rest/v1/replenishment_requests?select=id', {
      key: anonKey, token: storekeeperA.token, method: 'POST', prefer: 'return=representation',
      body: [{
        facility_id: facilityA.id, inventory_item_id: inventoryItem.id,
        source_report_id: report.id, requested_quantity: 30, unit: 'packets',
        status: 'recommended_to_facility_store', data_mode: 'synthetic_demo'
      }]
    });
  } catch (error) {
    storekeeperCreateDenied = /Only an assigned active supervisor|permission denied|42501/i.test(error.message);
  }
  assert.equal(storekeeperCreateDenied, true, 'storekeeper cannot create a supervisor indent recommendation');

  const indentRows = await request('/rest/v1/replenishment_requests?select=id,facility_id,inventory_item_id,requested_quantity,status,received_quantity,unit', {
    key: anonKey, token: supervisorA.token, method: 'POST', prefer: 'return=representation',
    body: [{
      facility_id: facilityA.id, inventory_item_id: inventoryItem.id,
      source_report_id: report.id, requested_quantity: 30, on_hand_quantity: 5,
      unit: 'packets', status: 'recommended_to_facility_store',
      data_mode: 'synthetic_demo', note: 'Synthetic local E2E workflow only'
    }]
  });
  assert.equal(indentRows.length, 1, 'assigned supervisor can create a recommendation linked to a verified report');
  const indent = indentRows[0];

  const clarificationRows = await request('/rest/v1/replenishment_requests?select=id,facility_id,status,note', {
    key: anonKey, token: supervisorA.token, method: 'POST', prefer: 'return=representation',
    body: [{
      facility_id: facilityA.id,
      inventory_item_id: inventoryItem.id,
      source_report_id: report.id,
      requested_quantity: 7,
      on_hand_quantity: 0,
      unit: 'packets',
      status: 'recommended_to_facility_store',
      data_mode: 'synthetic_demo',
      note: 'Synthetic clarification authorization E2E test'
    }]
  });
  assert.equal(clarificationRows.length, 1,
    'assigned supervisor can create a separate clarification test indent');

  const clarificationIndent = clarificationRows[0];
  const clarificationPath = '/rest/v1/replenishment_requests?id=eq.' +
    clarificationIndent.id + '&select=id,status,note';

  let storekeeperReturnDenied = false;
  try {
    const rows = await request(clarificationPath, {
      key: anonKey, token: storekeeperA.token, method: 'PATCH',
      prefer: 'return=representation',
      body: {
        status: 'returned_for_clarification',
        note: 'Synthetic unauthorized storekeeper return'
      }
    });
    storekeeperReturnDenied = rows.length === 0;
  } catch (error) {
    storekeeperReturnDenied =
      /Only an assigned active supervisor|permission denied|42501|row-level security/i.test(error.message);
  }
  assert.equal(storekeeperReturnDenied, true,
    'storekeeper cannot return an indent for clarification');

  const storekeeperDeniedState = await request(clarificationPath);
  assert.equal(storekeeperDeniedState[0]?.status, 'recommended_to_facility_store',
    'storekeeper denial leaves the indent unchanged');

  let crossFacilityReturnDenied = false;
  try {
    const rows = await request(clarificationPath, {
      key: anonKey, token: supervisorB.token, method: 'PATCH',
      prefer: 'return=representation',
      body: {
        status: 'returned_for_clarification',
        note: 'Synthetic cross-facility supervisor return'
      }
    });
    crossFacilityReturnDenied = rows.length === 0;
  } catch (error) {
    crossFacilityReturnDenied =
      /permission denied|42501|row-level security|Only an assigned active supervisor/i.test(error.message);
  }
  assert.equal(crossFacilityReturnDenied, true,
    'supervisor assigned to another facility cannot return this indent');

  const crossFacilityDeniedState = await request(clarificationPath);
  assert.equal(crossFacilityDeniedState[0]?.status, 'recommended_to_facility_store',
    'cross-facility denial leaves the indent unchanged');

  let missingReasonDenied = false;
  try {
    await request(clarificationPath, {
      key: anonKey, token: supervisorA.token, method: 'PATCH',
      prefer: 'return=representation',
      body: { status: 'returned_for_clarification', note: '' }
    });
  } catch (error) {
    missingReasonDenied = /clarification reason/i.test(error.message);
  }
  assert.equal(missingReasonDenied, true,
    'supervisor cannot return an indent without a clarification reason');

  const missingReasonState = await request(clarificationPath);
  assert.equal(missingReasonState[0]?.status, 'recommended_to_facility_store',
    'missing-reason denial leaves the indent unchanged');

  const validClarificationReturn = await request(clarificationPath, {
    key: anonKey, token: supervisorA.token, method: 'PATCH',
    prefer: 'return=representation',
    body: {
      status: 'returned_for_clarification',
      note: 'Synthetic E2E: please confirm the on-hand stock quantity.'
    }
  });
  assert.equal(validClarificationReturn[0]?.status, 'returned_for_clarification',
    'assigned active supervisor can return an eligible indent with a reason');

  const approvedRows = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status', {
    key: anonKey, token: supervisorA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'supervisor_approved' }
  });
  assert.equal(approvedRows[0]?.status, 'supervisor_approved', 'assigned supervisor can approve the recommendation');

  const submittedRows = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status', {
    key: anonKey, token: supervisorA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'submitted_to_dpdmis', dpdmis_reference: 'E2E-DPDMIS-' + suffix }
  });
  assert.equal(submittedRows[0]?.status, 'submitted_to_dpdmis', 'supervisor can record DPDMIS submission reference');

  let postDpdmisReturnDenied = false;
  try {
    const rows = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status', {
      key: anonKey, token: supervisorA.token, method: 'PATCH',
      prefer: 'return=representation',
      body: {
        status: 'returned_for_clarification',
        note: 'Synthetic E2E attempt after DPDMIS submission'
      }
    });
    postDpdmisReturnDenied = rows.length === 0;
  } catch (error) {
    postDpdmisReturnDenied =
      /DPDMIS-submitted request cannot be returned/i.test(error.message);
  }
  assert.equal(postDpdmisReturnDenied, true,
    'DPDMIS-submitted indent cannot be returned through clarification workflow');

  const postDpdmisState = await request(
    '/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status,dpdmis_reference'
  );
  assert.equal(postDpdmisState[0]?.status, 'submitted_to_dpdmis',
    'denied post-DPDMIS return leaves the main indent submitted');
  assert.equal(postDpdmisState[0]?.dpdmis_reference, 'E2E-DPDMIS-' + suffix,
    'denied post-DPDMIS return preserves its external reference');

  let supervisorAllocationDenied = false;
  try {
    await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status', {
      key: anonKey, token: supervisorA.token, method: 'PATCH', prefer: 'return=representation',
      body: { status: 'allocated', allocation_reference: 'E2E-ALLOC-SUP-' + suffix }
    });
  } catch (error) {
    supervisorAllocationDenied = /Only an assigned storekeeper|storekeeper can record allocation|not allowed/i.test(error.message);
  }
  assert.equal(supervisorAllocationDenied, true, 'supervisor cannot perform storekeeper allocation');

  const otherFacilityAllocation = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status', {
    key: anonKey, token: storekeeperB.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'allocated', allocation_reference: 'E2E-ALLOC-OTHER-' + suffix }
  });
  assert.equal(otherFacilityAllocation.length, 0, 'other-facility storekeeper cannot access this indent');

  const allocatedRows = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status', {
    key: anonKey, token: storekeeperA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'allocated', allocation_reference: 'E2E-ALLOC-' + suffix }
  });
  assert.equal(allocatedRows[0]?.status, 'allocated', 'assigned storekeeper can record allocation');

  const dispatchedRows = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status', {
    key: anonKey, token: storekeeperA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'dispatched', dispatch_reference: 'E2E-CHALLAN-' + suffix }
  });
  assert.equal(dispatchedRows[0]?.status, 'dispatched', 'assigned storekeeper can record dispatch with challan reference');

  let missingReceiptReferenceDenied = false;
  try {
    await request('/rest/v1/replenishment_requests?id=eq.' + indent.id, {
      key: anonKey, token: storekeeperA.token, method: 'PATCH',
      body: { status: 'partially_received', received_quantity: 12, receipt_reference: '' }
    });
  } catch (error) {
    missingReceiptReferenceDenied = /goods receipt reference|receipt reference/i.test(error.message);
  }
  assert.equal(missingReceiptReferenceDenied, true, 'receipt without an external goods-receipt reference is rejected');

  let overReceiptDenied = false;
  try {
    await request('/rest/v1/replenishment_requests?id=eq.' + indent.id, {
      key: anonKey, token: storekeeperA.token, method: 'PATCH',
      body: { status: 'received', received_quantity: 31, receipt_reference: 'E2E-GRN-OVER-' + suffix }
    });
  } catch (error) {
    overReceiptDenied = /exceed|replenishment_received_not_over_requested/i.test(error.message);
  }
  assert.equal(overReceiptDenied, true, 'receipt quantity above requested quantity is rejected');

  const partialRows = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status,received_quantity', {
    key: anonKey, token: storekeeperA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'partially_received', received_quantity: 12, receipt_reference: 'E2E-GRN-PART-' + suffix }
  });
  assert.equal(partialRows[0]?.status, 'partially_received', 'storekeeper can record a valid partial receipt');
  assert.equal(Number(partialRows[0]?.received_quantity), 12);

  const completeRows = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status,received_quantity', {
    key: anonKey, token: storekeeperA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'received', received_quantity: 30, receipt_reference: 'E2E-GRN-FINAL-' + suffix }
  });
  assert.equal(completeRows[0]?.status, 'received', 'storekeeper can complete receipt at the exact requested quantity');
  assert.equal(Number(completeRows[0]?.received_quantity), 30);

  const movementPath = '/rest/v1/inventory_movements?select=id,quantity_delta,unit,external_reference,movement_type,data_mode,recorded_by_user_id&replenishment_request_id=eq.' + indent.id + '&order=created_at.asc';
  const movements = await request(movementPath, { key: anonKey, token: storekeeperA.token });
  assert.equal(movements.length, 2, 'partial and final receipts each create one inventory movement');
  assert.deepEqual(movements.map(x => Number(x.quantity_delta)), [12, 18], 'ledger records receipt deltas, not cumulative totals');
  assert.equal(movements.reduce((sum, x) => sum + Number(x.quantity_delta), 0), 30, 'movement deltas reconcile to the requested quantity');
  assert(movements.every(x => x.movement_type === 'inbound_receipt' && x.data_mode === 'synthetic_demo'));
  assert(movements.every(x => x.recorded_by_user_id === storekeeperA.id), 'movement ledger records the authenticated storekeeper');
  assert(movements.every(x => x.external_reference), 'every movement retains its external receipt reference');

  const replayRows = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status,received_quantity', {
    key: anonKey, token: storekeeperA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'received', received_quantity: 30, receipt_reference: 'E2E-GRN-FINAL-' + suffix }
  });
  assert.equal(replayRows[0]?.status, 'received', 'exact receipt retry is accepted as an idempotent no-op');
  const replayMovements = await request(movementPath, { key: anonKey, token: storekeeperA.token });
  assert.equal(replayMovements.length, 2, 'idempotent receipt retry does not duplicate ledger movements');

  const storekeeperReportReview = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status', {
    key: anonKey, token: storekeeperA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'closed' }
  });
  assert.equal(storekeeperReportReview.length, 0, 'storekeeper cannot perform supervisor report review');

  // Part 2H.11: inventory ledger integrity, event history and state-transition audit.
  const storekeeperMovementRows = await request(movementPath, { key: anonKey, token: storekeeperA.token });
  assert.equal(storekeeperMovementRows.length, 2, 'assigned storekeeper can read facility A receipt movements');
  const crossFacilityMovementRows = await request(movementPath, { key: anonKey, token: storekeeperB.token });
  assert.equal(crossFacilityMovementRows.length, 0, 'other-facility storekeeper cannot read facility A movements');
  const workerMovementRows = await request(movementPath, { key: anonKey, token: workerA.token });
  assert.equal(workerMovementRows.length, 0, 'worker role cannot read the inventory movement ledger');

  let directLedgerInsertDenied = false;
  try {
    await request('/rest/v1/inventory_movements', {
      key: anonKey, token: storekeeperA.token, method: 'POST',
      body: [{
        facility_id: facilityA.id, inventory_item_id: inventoryItem.id,
        replenishment_request_id: indent.id, movement_type: 'inbound_receipt',
        quantity_delta: 1, unit: 'packets', external_reference: 'E2E-DIRECT-' + suffix,
        data_mode: 'synthetic_demo', recorded_by_user_id: storekeeperA.id
      }]
    });
  } catch (error) {
    directLedgerInsertDenied = /failed \((401|403)\)|permission denied|42501/i.test(error.message);
  }
  assert.equal(directLedgerInsertDenied, true, 'authenticated storekeeper cannot insert directly into immutable inventory ledger');

  let directLedgerUpdateDenied = false;
  try {
    await request('/rest/v1/inventory_movements?id=eq.' + movements[0].id, {
      key: anonKey, token: storekeeperA.token, method: 'PATCH',
      body: { quantity_delta: 999 }
    });
  } catch (error) {
    directLedgerUpdateDenied = /failed \((401|403)\)|permission denied|42501/i.test(error.message);
  }
  assert.equal(directLedgerUpdateDenied, true, 'authenticated storekeeper cannot update inventory ledger rows');

  let directLedgerDeleteDenied = false;
  try {
    await request('/rest/v1/inventory_movements?id=eq.' + movements[0].id, {
      key: anonKey, token: storekeeperA.token, method: 'DELETE'
    });
  } catch (error) {
    directLedgerDeleteDenied = /failed \((401|403)\)|permission denied|42501/i.test(error.message);
  }
  assert.equal(directLedgerDeleteDenied, true, 'authenticated storekeeper cannot delete inventory ledger rows');

  let immutableRequestFieldsDenied = false;
  try {
    await request('/rest/v1/replenishment_requests?id=eq.' + indent.id, {
      key: anonKey, token: storekeeperA.token, method: 'PATCH',
      body: { requested_quantity: 999 }
    });
  } catch (error) {
    immutableRequestFieldsDenied = /immutable|Indent ownership|requested quantity|permission denied|42501/i.test(error.message);
  }
  assert.equal(immutableRequestFieldsDenied, true, 'requested quantity and indent ownership cannot be rewritten');

  let backwardsTransitionDenied = false;
  try {
    await request('/rest/v1/replenishment_requests?id=eq.' + indent.id, {
      key: anonKey, token: storekeeperA.token, method: 'PATCH',
      body: { status: 'dispatched' }
    });
  } catch (error) {
    backwardsTransitionDenied = /not allowed|transition/i.test(error.message);
  }
  assert.equal(backwardsTransitionDenied, true, 'completed receipt cannot transition backwards to dispatched');

  const replenishmentEvents = await request('/rest/v1/replenishment_events?select=id,action,status_from,status_to,quantity_delta,external_reference&replenishment_request_id=eq.' + indent.id + '&order=created_at.asc', {
    key: anonKey, token: storekeeperA.token
  });
  assert(replenishmentEvents.some(x => x.action === 'indent_created'), 'append-only replenishment history records indent creation');
  assert(replenishmentEvents.some(x => x.status_to === 'supervisor_approved'), 'append-only history records supervisor approval');
  assert(replenishmentEvents.some(x => x.status_to === 'submitted_to_dpdmis'), 'append-only history records DPDMIS submission');
  assert(replenishmentEvents.some(x => x.status_to === 'allocated'), 'append-only history records allocation');
  assert(replenishmentEvents.some(x => x.status_to === 'dispatched'), 'append-only history records dispatch');
  assert.equal(replenishmentEvents.filter(x => x.action === 'receipt_recorded').reduce((sum, x) => sum + Number(x.quantity_delta || 0), 0), 30,
    'append-only receipt event deltas reconcile to 30');

  let duplicateReferenceDenied = false;
  const duplicateIndentRows = await request('/rest/v1/replenishment_requests?select=id,status', {
    key: anonKey, token: supervisorA.token, method: 'POST', prefer: 'return=representation',
    body: [{
      facility_id: facilityA.id, inventory_item_id: inventoryItem.id,
      source_report_id: report.id, requested_quantity: 20, on_hand_quantity: 0,
      unit: 'packets', status: 'recommended_to_facility_store',
      data_mode: 'synthetic_demo', note: 'Synthetic duplicate-reference integrity test'
    }]
  });
  const duplicateIndent = duplicateIndentRows[0];
  await request('/rest/v1/replenishment_requests?id=eq.' + duplicateIndent.id, {
    key: anonKey, token: supervisorA.token, method: 'PATCH',
    body: { status: 'supervisor_approved' }
  });
  await request('/rest/v1/replenishment_requests?id=eq.' + duplicateIndent.id, {
    key: anonKey, token: supervisorA.token, method: 'PATCH',
    body: { status: 'submitted_to_dpdmis', dpdmis_reference: 'E2E-DPDMIS-SECOND-' + suffix }
  });
  await request('/rest/v1/replenishment_requests?id=eq.' + duplicateIndent.id, {
    key: anonKey, token: storekeeperA.token, method: 'PATCH',
    body: { status: 'allocated', allocation_reference: 'E2E-ALLOC-SECOND-' + suffix }
  });
  await request('/rest/v1/replenishment_requests?id=eq.' + duplicateIndent.id, {
    key: anonKey, token: storekeeperA.token, method: 'PATCH',
    body: { status: 'dispatched', dispatch_reference: 'E2E-CHALLAN-SECOND-' + suffix }
  });
  await request('/rest/v1/replenishment_requests?id=eq.' + duplicateIndent.id, {
    key: anonKey, token: storekeeperA.token, method: 'PATCH',
    body: { status: 'partially_received', received_quantity: 5, receipt_reference: 'E2E-GRN-DUP-' + suffix }
  });
  try {
    await request('/rest/v1/replenishment_requests?id=eq.' + duplicateIndent.id, {
      key: anonKey, token: storekeeperA.token, method: 'PATCH',
      body: { status: 'partially_received', received_quantity: 10, receipt_reference: 'E2E-GRN-DUP-' + suffix }
    });
  } catch (error) {
    duplicateReferenceDenied = /duplicate key|inventory_movements_request_reference_uidx|unique constraint/i.test(error.message);
  }
  assert.equal(duplicateReferenceDenied, true, 'same external receipt reference cannot create a duplicate movement for one indent');
  const duplicateIndentState = await request('/rest/v1/replenishment_requests?id=eq.' + duplicateIndent.id + '&select=status,received_quantity', {
    key: anonKey, token: storekeeperA.token
  });
  assert.equal(duplicateIndentState[0]?.status, 'partially_received', 'failed duplicate reference transaction preserves prior indent state');
  assert.equal(Number(duplicateIndentState[0]?.received_quantity), 5, 'failed duplicate reference transaction preserves prior received quantity');
  const duplicateIndentMovements = await request('/rest/v1/inventory_movements?select=id,quantity_delta,external_reference&replenishment_request_id=eq.' + duplicateIndent.id, {
    key: anonKey, token: storekeeperA.token
  });
  assert.equal(duplicateIndentMovements.length, 1, 'duplicate reference rejection leaves exactly one movement');

  // Catalogue is reference-controlled; stock observations have role- and actor-scoped writes.
  let workerCatalogueInsertDenied = false;
  try {
    await request('/rest/v1/inventory_items', {
      key: anonKey, token: workerA.token, method: 'POST',
      body: [{ facility_id: facilityA.id, item_code: 'E2E-FORGED-' + suffix, name: 'Forged item', unit: 'packs' }]
    });
  } catch (error) {
    workerCatalogueInsertDenied = /failed \((401|403)\)|permission denied|42501/i.test(error.message);
  }
  assert.equal(workerCatalogueInsertDenied, true, 'worker cannot add or alter the reference inventory catalogue');

  let forgedSnapshotActorDenied = false;
  try {
    await request('/rest/v1/inventory_snapshots', {
      key: anonKey, token: workerA.token, method: 'POST',
      body: [{
        inventory_item_id: inventoryItem.id, quantity: 9, observed_by: workerBId,
        source: 'worker_report', data_mode: 'synthetic_demo', notes: 'Synthetic forged observer test'
      }]
    });
  } catch (error) {
    forgedSnapshotActorDenied = /failed \((401|403)\)|row-level security|permission denied|42501/i.test(error.message);
  }
  assert.equal(forgedSnapshotActorDenied, true, 'worker cannot submit an inventory snapshot attributed to another worker');

  let workerStorekeeperSnapshotDenied = false;
  try {
    await request('/rest/v1/inventory_snapshots', {
      key: anonKey, token: workerA.token, method: 'POST',
      body: [{
        inventory_item_id: inventoryItem.id, quantity: 9, observed_by: workerAId,
        source: 'storekeeper_count', data_mode: 'synthetic_demo', notes: 'Synthetic forbidden source test'
      }]
    });
  } catch (error) {
    workerStorekeeperSnapshotDenied = /failed \((401|403)\)|row-level security|permission denied|42501/i.test(error.message);
  }
  assert.equal(workerStorekeeperSnapshotDenied, true, 'worker cannot label their own snapshot as a storekeeper count');

  const storekeeperSnapshot = await request('/rest/v1/inventory_snapshots?select=id,inventory_item_id,quantity,source,data_mode', {
    key: anonKey, token: storekeeperA.token, method: 'POST', prefer: 'return=representation',
    body: [{
      inventory_item_id: inventoryItem.id, quantity: 14, observed_by: null,
      source: 'storekeeper_count', data_mode: 'synthetic_demo', notes: 'Synthetic authorized storekeeper count'
    }]
  });
  assert.equal(storekeeperSnapshot.length, 1, 'assigned storekeeper can record a storekeeper inventory count');
  assert.equal(storekeeperSnapshot[0]?.source, 'storekeeper_count');

  let replenishmentEventUpdateDenied = false;
  try {
    await request('/rest/v1/replenishment_events?replenishment_request_id=eq.' + indent.id, {
      key: anonKey, token: storekeeperA.token, method: 'PATCH', body: { note: 'tampered' }
    });
  } catch (error) {
    replenishmentEventUpdateDenied = /failed \((401|403)\)|permission denied|42501/i.test(error.message);
  }
  assert.equal(replenishmentEventUpdateDenied, true, 'authenticated storekeeper cannot mutate append-only replenishment events');

  let replenishmentEventDeleteDenied = false;
  try {
    await request('/rest/v1/replenishment_events?replenishment_request_id=eq.' + indent.id, {
      key: anonKey, token: storekeeperA.token, method: 'DELETE'
    });
  } catch (error) {
    replenishmentEventDeleteDenied = /failed \((401|403)\)|permission denied|42501/i.test(error.message);
  }
  assert.equal(replenishmentEventDeleteDenied, true, 'authenticated storekeeper cannot delete append-only replenishment events');

  // Part 2H.12: privilege escalation, assignment tampering and revocation.
  let profileRoleEscalationDenied = false;
  try {
    await request('/rest/v1/profiles?id=eq.' + workerA.id, {
      key: anonKey, token: workerA.token, method: 'PATCH',
      body: { role: 'platform_admin', status: 'active' }
    });
  } catch (error) {
    profileRoleEscalationDenied = /failed \((401|403)\)|permission denied|42501|not allowed/i.test(error.message);
  }
  assert.equal(profileRoleEscalationDenied, true, 'worker cannot elevate own profile role to platform admin');

  let assignmentInjectionDenied = false;
  try {
    await request('/rest/v1/user_facility_assignments', {
      key: anonKey, token: workerA.token, method: 'POST',
      body: [{ user_id: workerA.id, facility_id: facilityB.id, assignment_role: 'supervisor' }]
    });
  } catch (error) {
    assignmentInjectionDenied = /failed \((401|403)\)|permission denied|42501/i.test(error.message);
  }
  assert.equal(assignmentInjectionDenied, true, 'worker cannot create a cross-facility supervisor assignment');

  let assignmentTamperDenied = false;
  try {
    await request('/rest/v1/user_facility_assignments?user_id=eq.' + workerA.id, {
      key: anonKey, token: workerA.token, method: 'PATCH', body: { assignment_role: 'platform_admin' }
    });
  } catch (error) {
    assignmentTamperDenied = /failed \((401|403)\)|permission denied|42501/i.test(error.message);
  }
  assert.equal(assignmentTamperDenied, true, 'worker cannot modify facility assignment role');

  let assignmentDeleteDenied = false;
  try {
    await request('/rest/v1/user_facility_assignments?user_id=eq.' + workerA.id, {
      key: anonKey, token: workerA.token, method: 'DELETE'
    });
  } catch (error) {
    assignmentDeleteDenied = /failed \((401|403)\)|permission denied|42501/i.test(error.message);
  }
  assert.equal(assignmentDeleteDenied, true, 'worker cannot revoke or delete facility assignments');

  // Administrative revocation uses the service role only, then validates the
  // already-issued access token loses facility visibility immediately.
  await request('/rest/v1/user_facility_assignments?user_id=eq.' + storekeeperA.id + '&facility_id=eq.' + facilityA.id, {
    method: 'DELETE'
  });
  const afterAssignmentRevocation = await request('/rest/v1/inventory_movements?select=id&replenishment_request_id=eq.' + indent.id, {
    key: anonKey, token: storekeeperA.token
  });
  assert.equal(afterAssignmentRevocation.length, 0, 'revoked facility assignment removes ledger access for an existing token');

  await request('/rest/v1/user_facility_assignments', {
    method: 'POST',
    body: [{ user_id: storekeeperA.id, facility_id: facilityA.id, assignment_role: 'storekeeper' }]
  });
  const afterAssignmentRestore = await request(movementPath, { key: anonKey, token: storekeeperA.token });
  assert.equal(afterAssignmentRestore.length, 2, 'restored active facility assignment restores scoped ledger access');

  await request('/rest/v1/profiles?id=eq.' + storekeeperA.id, {
    method: 'PATCH', body: { status: 'suspended' }
  });
  const afterProfileSuspensionFacilities = await scopedFacilities(storekeeperA);
  assert.equal(afterProfileSuspensionFacilities.length, 0, 'suspended profile loses facility access despite a valid existing token');
  const afterProfileSuspensionMovements = await request(movementPath, { key: anonKey, token: storekeeperA.token });
  assert.equal(afterProfileSuspensionMovements.length, 0, 'suspended profile loses inventory ledger access');

  const anonymous = await fetch(apiUrl + '/rest/v1/profiles?select=id', { headers: headers(anonKey) });
  if (anonymous.status === 200) {
    const anonymousRows = await anonymous.json();
    assert.equal(anonymousRows.length, 0, 'anonymous user cannot read private profiles');
  } else {
    assert([401, 403].includes(anonymous.status), 'anonymous profile access is denied');
  }

  console.log('PASS local Supabase Auth health');
  console.log('PASS six synthetic Auth accounts created and password-authenticated');
  console.log('PASS server-side profile provisioning trigger and scoped active profiles');
  console.log('PASS worker and supervisor facility isolation across two synthetic facilities');
  console.log('PASS worker draft report creation');
  console.log('PASS worker draft remains private until submission');
  console.log('PASS same-facility supervisor report visibility after submission');
  console.log('PASS worker submission, correction request, structured item correction and resubmission');
  console.log('PASS report correction event history records status transitions and changed fields');
  console.log('PASS assigned supervisor reverifies the corrected and resubmitted report');
  console.log('PASS cross-facility supervisor and worker report isolation');
  console.log('PASS worker cannot verify own report; cross-facility supervisor review denied');
  console.log('PASS storekeeper cannot create supervisor indent or review worker report');
  console.log('PASS supervisor clarification return requires assignment and a non-empty reason');
  console.log('PASS storekeeper and cross-facility supervisor clarification returns are denied');
  console.log('PASS DPDMIS-submitted indent cannot be returned for clarification');
  console.log('PASS supervisor approval and DPDMIS reference precede storekeeper fulfilment');
  console.log('PASS supervisor and cross-facility storekeeper cannot allocate');
  console.log('PASS storekeeper allocation and dispatch require their role and references');
  console.log('PASS missing receipt reference and over-receipt are rejected');
  console.log('PASS partial and final receipts create reconciled inbound ledger deltas');
  console.log('PASS exact receipt retry is idempotent and does not duplicate ledger entries');
  console.log('PASS inventory movement visibility is facility- and role-scoped');
  console.log('PASS authenticated users cannot directly insert, update or delete ledger rows');
  console.log('PASS immutable indent fields and backwards transitions are rejected');
  console.log('PASS append-only replenishment event history reconciles receipt deltas');
  console.log('PASS duplicate external receipt reference is rejected atomically');
  console.log('PASS inventory catalogue writes are denied to operational users');
  console.log('PASS inventory snapshot actor/source spoofing is rejected');
  console.log('PASS assigned storekeeper can record a scoped inventory count');
  console.log('PASS replenishment event history cannot be updated or deleted by authenticated users');
  console.log('PASS privilege escalation and facility assignment tampering are denied');
  console.log('PASS administrative assignment revocation removes access for an existing token');
  console.log('PASS suspended profile loses scoped access without token replacement');
  console.log('PASS anonymous profile access denied by RLS');
} finally {
  // Workflow events are intentionally append-only. Deleting a report cascades
  // into report_events and is rejected by the database safeguard. Retain each
  // uniquely marked synthetic run as local audit evidence instead of weakening
  // that protection or silently deleting related history.
  console.log('RETAINED synthetic E2E fixtures for run ' + suffix);
  console.log('RETAINED Auth users: ' + users.length);
  console.log('RETAINED synthetic facilities: ' + facilities.length);
  console.log('RETAINED synthetic report marker: Synthetic E2E report ' + suffix);
  console.log('NOTE: use npx supabase db reset only when you intentionally want to clear ALL local database data and rebuild from migrations.');
}
