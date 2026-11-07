const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20261107060000_busho_database_query_tuning.sql'),
  'utf8'
);

test('report UPDATE is consolidated without widening worker or supervisor transitions', () => {
  assert.match(migration, /create policy reports_scoped_update on public\\.reports/i);
  assert.match(migration, /current_profile_role\\(\\) = 'worker'/i);
  assert.match(migration, /current_profile_role\\(\\) = 'supervisor'/i);
  assert.match(migration, /status in \\(\'draft\',\'correction_requested\'\\)/i);
  assert.match(migration, /status in \\(\'submitted\',\'resubmitted\',\'supervisor_verified\',\'escalated\'\\)/i);
  assert.match(migration, /drop policy if exists reports_worker_update/i);
  assert.match(migration, /drop policy if exists reports_supervisor_update/i);
});

test('replenishment SELECT merges operations scope and worker-owned report tracking', () => {
  assert.match(migration, /create policy replenishment_requests_scoped_select on public\\.replenishment_requests/i);
  assert.match(migration, /has_facility_access\\(facility_id,[\\s\\S]*?district_admin[\\s\\S]*?state_admin/i);
  assert.match(migration, /current_profile_role\\(\\) = 'worker'/i);
  assert.match(migration, /r\\.worker_id = app_private\\.auth_worker_id\\(\\)/i);
  assert.match(migration, /drop policy if exists replenishment_requests_worker_select/i);
});

test('all 26 missing foreign-key indexes are added and duplicate stock index is removed', () => {
  const indexes = migration.match(/create index if not exists [a-z0-9_]+/gi) || [];
  assert.equal(indexes.length, 26);
  assert.match(migration, /drop index if exists public\\.inventory_snapshots_item_observed_idx/i);
  assert.doesNotMatch(migration, /drop index if exists public\\.idx_inventory_snapshots_latest/i);
});
