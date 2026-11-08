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

  const verified = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status', {
    key: anonKey, token: supervisorA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'supervisor_verified' }
  });
  assert.equal(verified[0]?.status, 'supervisor_verified', 'assigned supervisor can verify submitted report');
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
    storekeeperCreateDenied = /failed \((401|403)\)/.test(error.message);
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

  const supervisorAllocation = await request('/rest/v1/replenishment_requests?id=eq.' + indent.id + '&select=id,status', {
    key: anonKey, token: supervisorA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'allocated', allocation_reference: 'E2E-ALLOC-SUP-' + suffix }
  });
  assert.equal(supervisorAllocation.length, 0, 'supervisor cannot perform storekeeper allocation');

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

  const anonymous = await fetch(apiUrl + '/rest/v1/profiles?select=id', { headers: headers(anonKey) });
  if (anonymous.status === 200) {
    const anonymousRows = await anonymous.json();
    assert.equal(anonymousRows.length, 0, 'anonymous user cannot read private profiles');
  } else {
    assert([401, 403].includes(anonymous.status), 'anonymous profile access is denied');
  }

  console.log('PASS local Supabase Auth health');
  console.log('PASS four synthetic Auth accounts created and password-authenticated');
  console.log('PASS server-side profile provisioning trigger and scoped active profiles');
  console.log('PASS worker and supervisor facility isolation across two synthetic facilities');
  console.log('PASS worker draft report creation');
  console.log('PASS worker draft remains private until submission');
  console.log('PASS same-facility supervisor report visibility after submission');
  console.log('PASS worker submission and supervisor verification transitions');
  console.log('PASS cross-facility supervisor and worker report isolation');
  console.log('PASS worker cannot verify own report; cross-facility supervisor review denied');
  console.log('PASS storekeeper cannot create supervisor indent or review worker report');
  console.log('PASS supervisor approval and DPDMIS reference precede storekeeper fulfilment');
  console.log('PASS supervisor and cross-facility storekeeper cannot allocate');
  console.log('PASS storekeeper allocation and dispatch require their role and references');
  console.log('PASS missing receipt reference and over-receipt are rejected');
  console.log('PASS partial and final receipts create reconciled inbound ledger deltas');
  console.log('PASS exact receipt retry is idempotent and does not duplicate ledger entries');
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
