const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(
  path.join(__dirname, '..', 'supabase/migrations/20261107060000_busho_database_query_tuning.sql'),
  'utf8'
);

test('report UPDATE is consolidated without widening worker or supervisor transitions', () => {
  assert.ok(migration.includes('create policy reports_scoped_update on public.reports'));
  assert.ok(migration.includes("current_profile_role() = 'worker'"));
  assert.ok(migration.includes("current_profile_role() = 'supervisor'"));
  assert.ok(migration.includes("status in ('draft','correction_requested')"));
  assert.ok(migration.includes("status in ('submitted','resubmitted','supervisor_verified','escalated')"));
  assert.ok(migration.includes('drop policy if exists reports_worker_update'));
  assert.ok(migration.includes('drop policy if exists reports_supervisor_update'));
});

test('replenishment SELECT merges operations scope and worker-owned report tracking', () => {
  assert.ok(migration.includes('create policy replenishment_requests_scoped_select on public.replenishment_requests'));
  assert.ok(migration.includes("array['supervisor','storekeeper','district_admin','state_admin']::text[]"));
  assert.ok(migration.includes("current_profile_role() = 'worker'"));
  assert.ok(migration.includes('r.worker_id = app_private.auth_worker_id()'));
  assert.ok(migration.includes('drop policy if exists replenishment_requests_worker_select'));
});

test('all 26 missing foreign-key indexes are added and duplicate stock index is removed', () => {
  const indexes = migration.match(/create index if not exists [a-z0-9_]+/gi) || [];
  assert.equal(indexes.length, 26);
  assert.ok(migration.includes('drop index if exists public.inventory_snapshots_item_observed_idx'));
  assert.ok(!migration.includes('drop index if exists public.idx_inventory_snapshots_latest'));
});
