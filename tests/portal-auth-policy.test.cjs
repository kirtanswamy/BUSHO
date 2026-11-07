const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../portal-auth-policy.js');

test('active worker is allowed into the worker portal', () => {
  assert.deepEqual(policy.evaluateProfile({
    id: 'worker-1', role: 'worker', status: 'active'
  }, ['worker']), { allowed: true, reason: null });
});

test('active supervisor is denied access to the worker portal', () => {
  assert.deepEqual(policy.evaluateProfile({
    id: 'supervisor-1', role: 'supervisor', status: 'active'
  }, ['worker']), { allowed: false, reason: 'wrong_role' });
});

test('district and state administrators can enter the operations console as read-scoped roles', () => {
  for (const role of ['supervisor', 'storekeeper', 'district_admin', 'state_admin', 'platform_admin']) {
    assert.equal(policy.evaluateProfile({ id: role, role, status: 'active' }, [
      'supervisor', 'storekeeper', 'district_admin', 'state_admin', 'platform_admin'
    ]).allowed, true, role);
  }
});

test('pending and suspended profiles never enter an operational portal', () => {
  for (const status of ['pending', 'suspended']) {
    assert.deepEqual(policy.evaluateProfile({
      id: 'unprovisioned', role: 'worker', status
    }, ['worker']), { allowed: false, reason: 'account_not_active' });
  }
});

test('missing profile and role mismatch are denied without trusting browser-supplied role', () => {
  assert.deepEqual(policy.evaluateProfile(null, ['worker']), {
    allowed: false, reason: 'profile_missing'
  });
  assert.deepEqual(policy.evaluateProfile({
    id: 'worker-1', role: 'worker', status: 'active'
  }, ['supervisor']), { allowed: false, reason: 'wrong_role' });
});
test('platform, state and district administrators are admitted only to the dedicated administrator role allowlist', () => {
  const adminRoles = ['platform_admin','state_admin','district_admin'];
  for (const role of adminRoles) {
    assert.equal(policy.evaluateProfile({ id: role, role, status: 'active' }, adminRoles).allowed, true, role);
    assert.equal(policy.evaluateProfile({ id: role, role, status: 'active' }, ['worker']).allowed, false, role);
  }
});
