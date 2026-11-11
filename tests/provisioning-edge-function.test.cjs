const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('provisioning Edge Function authenticates the caller through the Supabase server context', () => {
  const source = read('supabase/functions/provision-user/index.ts');
  assert.match(source, /withSupabase\(\{ auth: 'user' \}/);
  assert.match(source, /ctx\.userClaims\?\.id/);
  assert.match(source, /ctx\.supabaseAdmin/);
  assert.match(source, /from\('profiles'\)[\s\S]*select\('id,role,status'\)/);
  assert.match(source, /from\('user_scope_assignments'\)/);
});

test('provisioning Edge Function bounds and validates the request before reading input', () => {
  const source = read('supabase/functions/provision-user/index.ts');
  assert.match(source, /application\/json/);
  assert.match(source, /contentLength > 12_000/);
  assert.match(source, /size > 12_000/);
  assert.match(source, /reader\.cancel\(\)/);
  assert.match(source, /JSON\.parse\(new TextDecoder\(\)\.decode\(bytes\)\)/);
});

test('provisioning Edge Function restricts browser origins and uses no-store responses', () => {
  const source = read('supabase/functions/provision-user/index.ts');
  assert.match(source, /BUSHO_ALLOWED_ORIGINS/);
  assert.match(source, /Origin is not allowed/);
  assert.match(source, /Cache-Control', 'no-store'/);
  assert.match(source, /'Access-Control-Allow-Methods': 'POST, OPTIONS'/);
});

test('privileged Auth invitation and assignment writes remain server-side', () => {
  const source = read('supabase/functions/provision-user/index.ts');
  assert.match(source, /admin\.auth\.admin\.inviteUserByEmail/);
  assert.match(source, /admin\.auth\.admin\.deleteUser/);
  assert.match(source, /activateProfile/);
  assert.match(source, /insertFacilityAssignments/);
  assert.match(source, /insertScopeAssignment/);
  assert.doesNotMatch(read('admin-portal.js'), /service_role|secret_key|SUPABASE_SERVICE_ROLE_KEY/i);
});

test('provisioning operation ledger is server-only and supports durable request checkpoints', () => {
  const edge = read('supabase/functions/provision-user/index.ts');
  const service = read('supabase/functions/_shared/provisioning-service.mjs');
  const migration = read('supabase/migrations/20261112120000_durable_provisioning_operations.sql');
  assert.match(edge, /from\('provisioning_operations'\)/);
  assert.match(edge, /createProvisioningOperation/);
  assert.match(edge, /updateProvisioningOperation/);
  assert.match(service, /request_fingerprint/);
  assert.match(service, /reconciliation_required/);
  assert.match(migration, /unique \(requested_by, idempotency_key\)/);
  assert.match(migration, /reconciliation_required/);
  assert.match(migration, /revoke all on public\.provisioning_operations from anon, authenticated/);
});

test('admin retries preserve the same provisioning request key until success', () => {
  const admin = read('admin-portal.js');
  assert.match(admin, /provisioningRequestKey/);
  assert.match(admin, /crypto\.randomUUID\(\)/);
  assert.match(admin, /provisioningRequestKey = null;[\s\S]*form\.reset\(\)/);
});

test('provisioning is not exposed as a browser-side direct profile role update', () => {
  const client = read('supabase-client.js');
  assert.match(client, /functions\/v1\/provision-user/);
  assert.doesNotMatch(client, /from\('profiles'\)\.update\(\{[^}]*role/);
});
