import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCanProvision,
  assertDistrictAssignmentAllowed,
  assertFacilityAssignmentsAllowed,
  validateProvisioningInput,
  ProvisioningError
} from '../supabase/functions/_shared/provisioning-policy.mjs';
import { provisionUser } from '../supabase/functions/_shared/provisioning-service.mjs';

const FACILITY = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Verified HWC',
  state_lgd_code: '22',
  district_lgd_code: '101',
  verification_status: 'verified',
  is_synthetic: false,
  is_active: true
};
const STATE_SCOPE = {
  scope_level: 'state', state_lgd_code: '22', scope_role: 'state_admin',
  is_active: true, valid_from: '2026-01-01T00:00:00Z', valid_until: null
};
const DISTRICT_SCOPE = {
  scope_level: 'district', state_lgd_code: '22', district_lgd_code: '101',
  scope_role: 'district_admin', is_active: true,
  valid_from: '2026-01-01T00:00:00Z', valid_until: null
};
const FIXED_NOW = () => new Date('2026-11-07T12:00:00.000Z');

function workerInput(overrides = {}) {
  return {
    email: 'worker@example.org',
    displayName: 'Health Worker A',
    preferredLanguage: 'hi',
    role: 'worker',
    facilityIds: [FACILITY.id],
    consentConfirmed: true,
    ...overrides
  };
}

function makeHarness({ failAt = null, facilities = [FACILITY], district = { lgd_code: '101', state_lgd_code: '22' } } = {}) {
  const calls = [];
  const repository = {
    async listFacilities(ids) { calls.push(['listFacilities', ids]); return facilities; },
    async getDistrict(code) { calls.push(['getDistrict', code]); return district; },
    async activateProfile(id, payload) { calls.push(['activateProfile', id, payload]); if (failAt === 'activateProfile') throw new Error('profile update failed'); },
    async insertWorker(payload) { calls.push(['insertWorker', payload]); if (failAt === 'insertWorker') throw new Error('worker insert failed'); },
    async insertFacilityAssignments(rows) { calls.push(['insertFacilityAssignments', rows]); if (failAt === 'insertFacilityAssignments') throw new Error('assignment insert failed'); },
    async insertScopeAssignment(row) { calls.push(['insertScopeAssignment', row]); if (failAt === 'insertScopeAssignment') throw new Error('scope insert failed'); },
    async insertAuditLog(row) { calls.push(['insertAuditLog', row]); if (failAt === 'insertAuditLog') throw new Error('audit insert failed'); },
    async suspendProfile(id) { calls.push(['suspendProfile', id]); },
    async rollbackAssignments(id) { calls.push(['rollbackAssignments', id]); }
  };
  const authAdmin = {
    async inviteUserByEmail(email, options) {
      calls.push(['inviteUserByEmail', email, options]);
      if (failAt === 'invite') throw new Error('invite failed');
      return { id: '22222222-2222-4222-8222-222222222222', email };
    },
    async deleteUser(id) { calls.push(['deleteUser', id]); if (failAt === 'deleteUser') throw new Error('delete failed'); }
  };
  return { repository, authAdmin, calls };
}

test('validates worker provisioning input and requires explicit consent', () => {
  const result = validateProvisioningInput(workerInput());
  assert.equal(result.email, 'worker@example.org');
  assert.equal(result.role, 'worker');
  assert.equal(result.facilityIds.length, 1);
  assert.throws(
    () => validateProvisioningInput(workerInput({ consentConfirmed: false })),
    error => error instanceof ProvisioningError && error.code === 'worker_consent_required'
  );
});

test('rejects self-elevation, unsupported roles and invalid facility IDs', () => {
  assert.throws(() => validateProvisioningInput(workerInput({ role: 'platform_admin' })), /cannot be provisioned/i);
  assert.throws(() => validateProvisioningInput(workerInput({ facilityIds: ['not-a-uuid'] })), /valid facility records/i);
  assert.throws(
    () => assertCanProvision({ id: 'd-1', role: 'district_admin', status: 'active' }, [DISTRICT_SCOPE],
      validateProvisioningInput({ email:'admin@example.org', displayName:'Admin A', role:'district_admin', scope:{level:'district',stateLgdCode:'22',districtLgdCode:'101'} }), FIXED_NOW()),
    error => error instanceof ProvisioningError && error.code === 'role_hierarchy_denied'
  );
});

test('district administrator cannot assign a facility outside their active district', () => {
  assert.throws(
    () => assertFacilityAssignmentsAllowed(
      { role: 'district_admin' },
      [DISTRICT_SCOPE],
      [{ ...FACILITY, district_lgd_code: '102' }]
    ),
    error => error instanceof ProvisioningError && error.code === 'facility_scope_denied'
  );
});

test('rejects synthetic, unverified, inactive and out-of-state facilities', () => {
  for (const invalid of [
    { ...FACILITY, is_synthetic: true },
    { ...FACILITY, verification_status: 'unverified' },
    { ...FACILITY, is_active: false },
    { ...FACILITY, state_lgd_code: '27' }
  ]) {
    assert.throws(
      () => assertFacilityAssignmentsAllowed({ role: 'platform_admin' }, [], [invalid]),
      error => error instanceof ProvisioningError && error.code === 'facility_not_assignable'
    );
  }
});

test('state admin can provision a district admin only inside the assigned state', () => {
  const request = validateProvisioningInput({
    email: 'district@example.org',
    displayName: 'District Admin',
    role: 'district_admin',
    scope: { level: 'district', stateLgdCode: '22', districtLgdCode: '101' }
  });
  assertCanProvision({ id: 'state-1', role: 'state_admin', status: 'active' }, [STATE_SCOPE], request, FIXED_NOW());
  assertDistrictAssignmentAllowed({ role: 'state_admin' }, [STATE_SCOPE], { lgd_code: '101', state_lgd_code: '22' });
  assert.throws(
    () => assertDistrictAssignmentAllowed({ role: 'state_admin' }, [STATE_SCOPE], { lgd_code: '201', state_lgd_code: '27' }),
    error => error instanceof ProvisioningError && error.code === 'district_not_found'
  );
});

test('platform administrator can provision a state administrator but other roles cannot', () => {
  const request = validateProvisioningInput({
    email: 'state@example.org',
    displayName: 'State Admin',
    role: 'state_admin',
    scope: { level: 'state', stateLgdCode: '22' }
  });
  assertCanProvision({ id: 'platform-1', role: 'platform_admin', status: 'active' }, [], request, FIXED_NOW());
  assert.throws(
    () => assertCanProvision({ id: 'state-1', role: 'state_admin', status: 'active' }, [STATE_SCOPE], request, FIXED_NOW()),
    error => error instanceof ProvisioningError && error.code === 'role_hierarchy_denied'
  );
});

test('provisions worker with database role, facility assignment, consent timestamp and no role metadata', async () => {
  const harness = makeHarness();
  const result = await provisionUser({
    ...harness,
    callerProfile: { id: 'state-1', role: 'state_admin', status: 'active' },
    callerScopes: [STATE_SCOPE],
    input: workerInput(),
    appOrigin: 'https://busho.de5.net',
    now: FIXED_NOW
  });
  assert.equal(result.status, 'invited');
  assert.equal(result.role, 'worker');
  const invite = harness.calls.find(call => call[0] === 'inviteUserByEmail');
  assert.deepEqual(invite[2].data, { display_name: 'Health Worker A', preferred_language: 'hi' });
  assert.equal(Object.hasOwn(invite[2].data, 'role'), false);
  const profile = harness.calls.find(call => call[0] === 'activateProfile')[2];
  assert.deepEqual(profile, {
    display_name: 'Health Worker A', preferred_language: 'hi', role: 'worker', status: 'active'
  });
  const worker = harness.calls.find(call => call[0] === 'insertWorker')[1];
  assert.equal(worker.auth_user_id, result.userId);
  assert.equal(worker.facility_id, FACILITY.id);
  assert.equal(worker.consent_at, '2026-11-07T12:00:00.000Z');
  assert.ok(harness.calls.some(call => call[0] === 'insertFacilityAssignments'));
  assert.ok(harness.calls.some(call => call[0] === 'insertAuditLog'));
});

test('district admin cannot provision a worker when facility lookup returns no verified facility', async () => {
  const harness = makeHarness({ facilities: [] });
  await assert.rejects(
    provisionUser({
      ...harness,
      callerProfile: { id: 'district-1', role: 'district_admin', status: 'active' },
      callerScopes: [DISTRICT_SCOPE],
      input: workerInput(),
      appOrigin: 'https://busho.de5.net',
      now: FIXED_NOW
    }),
    error => error instanceof ProvisioningError && error.code === 'facility_lookup_failed'
  );
  assert.equal(harness.calls.some(call => call[0] === 'inviteUserByEmail'), false);
});

test('provisions a district admin with a scoped assignment and no facility worker row', async () => {
  const harness = makeHarness();
  const result = await provisionUser({
    ...harness,
    callerProfile: { id: 'state-1', role: 'state_admin', status: 'active' },
    callerScopes: [STATE_SCOPE],
    input: {
      email: 'district@example.org',
      displayName: 'District Admin',
      role: 'district_admin',
      scope: { level: 'district', stateLgdCode: '22', districtLgdCode: '101' }
    },
    appOrigin: 'https://busho.de5.net',
    now: FIXED_NOW
  });
  assert.equal(result.role, 'district_admin');
  const scope = harness.calls.find(call => call[0] === 'insertScopeAssignment')[1];
  assert.equal(scope.scope_role, 'district_admin');
  assert.equal(scope.scope_level, 'district');
  assert.equal(scope.district_lgd_code, '101');
  assert.equal(harness.calls.some(call => call[0] === 'insertWorker'), false);
});

test('rolls back Auth user, worker and assignments when a later provisioning step fails', async () => {
  const harness = makeHarness({ failAt: 'insertFacilityAssignments' });
  await assert.rejects(
    provisionUser({
      ...harness,
      callerProfile: { id: 'state-1', role: 'state_admin', status: 'active' },
      callerScopes: [STATE_SCOPE],
      input: workerInput(),
      appOrigin: 'https://busho.de5.net',
      now: FIXED_NOW
    }),
    error => error instanceof ProvisioningError && error.code === 'provisioning_failed'
  );
  assert.ok(harness.calls.some(call => call[0] === 'suspendProfile'));
  assert.ok(harness.calls.some(call => call[0] === 'rollbackAssignments'));
  assert.ok(harness.calls.some(call => call[0] === 'deleteUser'));
});

test('reports incomplete rollback explicitly and never silently claims provisioning succeeded', async () => {
  const harness = makeHarness({ failAt: 'insertFacilityAssignments' });
  harness.repository.rollbackAssignments = async () => { throw new Error('rollback failure'); };
  await assert.rejects(
    provisionUser({
      ...harness,
      callerProfile: { id: 'state-1', role: 'state_admin', status: 'active' },
      callerScopes: [STATE_SCOPE],
      input: workerInput(),
      appOrigin: 'https://busho.de5.net',
      now: FIXED_NOW
    }),
    error => error instanceof ProvisioningError && error.code === 'provisioning_rollback_incomplete'
  );
  assert.ok(harness.calls.some(call => call[0] === 'deleteUser'));
});
