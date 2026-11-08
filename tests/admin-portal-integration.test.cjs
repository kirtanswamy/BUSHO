const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('administrator workspace loads Auth gate before the provisioning controller', () => {
  const html = read('admin.html');
  const auth = html.indexOf('role-auth.js');
  const controller = html.indexOf('admin-portal.js');
  assert.match(html, /data-portal-role="admin"/);
  assert.ok(auth >= 0 && controller > auth);
  assert.match(html, /id="portal-login-form"/);
  assert.match(html, /id="portal-logout"/);
});

test('administrator form supports role, facility, geographic scope and worker consent controls', () => {
  const html = read('admin.html');
  for (const id of ['provision-name','provision-email','provision-role','provision-language','facility-options','provision-district','provision-consent','provision-submit']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /data-portal-role="admin"/);
  assert.match(html, /roles and geographic scope are validated by the server/i);
});

test('provisioning controller never accepts a browser-selected caller role as authority', () => {
  const js = read('admin-portal.js');
  assert.match(js, /event\.detail\?\.profile/);
  assert.match(js, /client\.listProvisioningOptions\(\)/);
  assert.match(js, /client\.provisionUser\(input\)/);
  assert.match(js, /profile\.role/);
  assert.doesNotMatch(js, /localStorage|sessionStorage/);
});

test('health worker invitations require one selected facility and explicit consent', () => {
  const js = read('admin-portal.js');
  assert.match(js, /role === 'worker' && facilityIds\.length !== 1/);
  assert.match(js, /role === 'worker' && !consent\.checked/);
  assert.match(js, /facilityIds: \['worker','supervisor'\]\.includes\(role\) \? facilityIds : \[\]/);
  assert.match(js, /stateLgdCode: '22'/);
});

test('platform, state and district roles have distinct server-permitted provisioning hierarchies', () => {
  const js = read('supabase/functions/_shared/provisioning-policy.mjs');
  assert.match(js, /platform_admin: PROVISIONABLE_ROLES/);
  assert.match(js, /state_admin: \['worker', 'supervisor', 'district_admin'\]/);
  assert.match(js, /district_admin: \['worker', 'supervisor'\]/);
  assert.match(js, /Only a platform administrator can provision a state administrator/);
  assert.match(js, /Only a state or platform administrator can provision a district administrator/);
});

test('administrator facility registry workflow requires source provenance, pagination and human review', () => {
  const html = read('admin.html');
  const js = read('admin-facility-registry.js');
  assert.match(html, /facility-import-form/);
  assert.match(html, /facility-source-authority/);
  assert.match(html, /facility-source-date/);
  assert.match(html, /facility-source-url/);
  assert.match(html, /facility-import-file/);
  assert.match(js, /create_batch/);
  assert.match(js, /stage_candidates/);
  assert.match(js, /review_candidate/);
  assert.match(js, /complete_batch/);
  assert.match(js, /Verify and add facility/);
  assert.match(js, /Reject candidate/);
  assert.match(js, /minimum 8 characters/);
  assert.match(js, /facility-page-next/);
  assert.doesNotMatch(js, /localStorage|sessionStorage/);
});


test('storekeeper invitations are facility-scoped and require a verified facility', () => {
  const js = read('admin-portal.js');
  const policy = read('supabase/functions/_shared/provisioning-policy.mjs');
  assert.match(js, /storekeeper: 'Facility storekeeper'/);
  assert.match(js, /'worker','supervisor','storekeeper'/);
  assert.match(policy, /'worker', 'supervisor', 'storekeeper'/);
  assert.match(policy, /facilityIds.length < 1 \|\| facilityIds.length > 20/);
});
