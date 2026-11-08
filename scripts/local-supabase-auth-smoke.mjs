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

  await Promise.all([
    activate(workerA, 'worker'), activate(supervisorA, 'supervisor'),
    activate(workerB, 'worker'), activate(supervisorB, 'supervisor')
  ]);
  await Promise.all([
    assign(workerA, facilityA, 'worker'), assign(supervisorA, facilityA, 'supervisor'),
    assign(workerB, facilityB, 'worker'), assign(supervisorB, facilityB, 'supervisor')
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
      original_text: 'Synthetic E2E report; no patient information.',
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
  const verified = await request('/rest/v1/reports?id=eq.' + report.id + '&select=id,status', {
    key: anonKey, token: supervisorA.token, method: 'PATCH', prefer: 'return=representation',
    body: { status: 'supervisor_verified' }
  });
  assert.equal(verified[0]?.status, 'supervisor_verified', 'assigned supervisor can verify submitted report');
  const finalAReports = await scopedReports(supervisorA);
  assert(finalAReports.some(x => x.id === report.id && x.status === 'supervisor_verified'),
    'supervisor sees the verified report state');

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
  console.log('PASS anonymous profile access denied by RLS');
} finally {
  // Local synthetic test data only. Never suppress cleanup errors: a dirty local
  // database makes reruns misleading and must fail the test visibly.
  const cleanupErrors = [];
  const cleanup = async (label, path, options = {}) => {
    try {
      const rows = await request(path, { ...options, prefer: 'return=representation' });
      console.log('CLEANUP ' + label + ': ' + (Array.isArray(rows) ? rows.length : rows == null ? 0 : 1) + ' row(s)');
    } catch (error) {
      cleanupErrors.push(label + ': ' + error.message);
      console.error('CLEANUP FAILED ' + label + ': ' + error.message);
    }
  };

  // Reports first. report_events is ON DELETE CASCADE; explicit deletion is
  // unnecessary and keeping the parent delete atomic avoids partial cleanup.
  for (const facilityId of facilities) {
    await cleanup('reports for facility ' + facilityId,
      '/rest/v1/reports?facility_id=eq.' + encodeURIComponent(facilityId),
      { method: 'DELETE' });
  }
  for (const facilityId of facilities) {
    await cleanup('workers for facility ' + facilityId,
      '/rest/v1/workers?facility_id=eq.' + encodeURIComponent(facilityId),
      { method: 'DELETE' });
    await cleanup('facility assignments for ' + facilityId,
      '/rest/v1/user_facility_assignments?facility_id=eq.' + encodeURIComponent(facilityId),
      { method: 'DELETE' });
  }
  for (const facilityId of facilities) {
    await cleanup('facility ' + facilityId,
      '/rest/v1/facilities?id=eq.' + encodeURIComponent(facilityId),
      { method: 'DELETE' });
  }
  for (const id of users) {
    try {
      await request('/auth/v1/admin/users/' + encodeURIComponent(id), { method: 'DELETE' });
      console.log('CLEANUP Auth user ' + id + ': deleted');
    } catch (error) {
      cleanupErrors.push('Auth user ' + id + ': ' + error.message);
      console.error('CLEANUP FAILED Auth user ' + id + ': ' + error.message);
    }
  }

  // Verify this run's unique suffix is completely absent. Use exact markers
  // generated by this process; never sweep unrelated application data.
  const checks = [
    ['Auth users', "/rest/v1/users?select=id&email=like." + encodeURIComponent('busho-e2e-*-' + suffix + '@example.test')],
    ['facilities', "/rest/v1/facilities?select=id&name=like." + encodeURIComponent('SYNTHETIC E2E * ' + suffix)],
    ['reports', "/rest/v1/reports?select=id&original_text=eq." + encodeURIComponent('Synthetic E2E report; no patient information.') + '&facility_id=in.(' + facilities.map(encodeURIComponent).join(',') + ')']
  ];
  for (const [label, path] of checks) {
    try {
      const rows = await request(path);
      if (rows.length) cleanupErrors.push(label + ' remain after cleanup: ' + rows.length);
      console.log('CLEANUP VERIFY ' + label + ': ' + rows.length + ' remaining');
    } catch (error) {
      cleanupErrors.push('verification ' + label + ': ' + error.message);
      console.error('CLEANUP VERIFY FAILED ' + label + ': ' + error.message);
    }
  }

  if (cleanupErrors.length) {
    throw new Error('Local E2E cleanup incomplete:\n- ' + cleanupErrors.join('\n- '));
  }
}
