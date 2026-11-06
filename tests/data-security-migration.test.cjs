const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations');

function loadMigration() {
  assert.ok(fs.existsSync(migrationDir), 'Supabase migration directory must exist');
  const matches = fs.readdirSync(migrationDir)
    .filter(name => name.endsWith('_busho_operational_security_foundation.sql'));
  assert.equal(matches.length, 1, 'exactly one operational security foundation migration is required');
  return fs.readFileSync(path.join(migrationDir, matches[0]), 'utf8');
}

test('operational schema extends existing BUSHO records instead of creating parallel report stores', () => {
  const sql = loadMigration();
  for (const table of [
    'profiles',
    'user_facility_assignments',
    'user_scope_assignments',
    'states',
    'districts',
    'blocks',
    'report_events',
    'replenishment_events',
    'janaushadhi_district_snapshots'
  ]) {
    assert.match(sql, new RegExp('create table if not exists public\\.' + table + '\\b', 'i'), table + ' table must be created');
  }
  assert.match(sql, /alter table public\.reports/i);
  assert.match(sql, /alter table public\.replenishment_requests/i);
  assert.doesNotMatch(sql, /create table if not exists public\.(?:busho_)?(?:reports|worker_reports|stock_reports)\b/i);
});

test('new auth profiles start unprivileged and roles are never taken from user-editable metadata', () => {
  const sql = loadMigration();
  assert.match(sql, /role\s+text[^,]*default\s+'pending'/i);
  assert.match(sql, /status\s+text[^,]*default\s+'pending'/i);
  assert.match(sql, /references auth\.users/i);
  assert.match(sql, /raw_user_meta_data\s*->>\s*'full_name'/i);
  assert.doesNotMatch(sql, /raw_user_meta_data\s*->>\s*'role'/i);
  assert.match(sql, /grant update\s*\(\s*display_name\s*,\s*preferred_language\s*\)/i);
});

test('all exposed operational tables have RLS and explicit scoped policies', () => {
  const sql = loadMigration();
  for (const table of [
    'profiles', 'user_facility_assignments', 'user_scope_assignments',
    'facilities', 'workers', 'reports', 'report_items',
    'inventory_items', 'inventory_snapshots', 'replenishment_requests',
    'report_events', 'replenishment_events'
  ]) {
    assert.match(sql, new RegExp('alter table public\\.' + table + ' enable row level security', 'i'), table + ' must enable RLS');
  }
  assert.match(sql, /create policy profiles_self_select/i);
  assert.match(sql, /create policy facilities_scoped_select/i);
  assert.match(sql, /create policy reports_worker_insert/i);
  assert.match(sql, /create policy reports_supervisor_update/i);
  assert.match(sql, /create policy replenishment_requests_scoped_select/i);
  assert.match(sql, /revoke all privileges on all tables in schema public from anon/i);
  assert.doesNotMatch(sql, /create policy[^;]*for all[^;]*using\s*\(\s*true\s*\)/i);
});

test('workflow changes are constrained in Postgres and create append-only event histories', () => {
  const sql = loadMigration();
  for (const status of ['submitted', 'resubmitted', 'supervisor_verified', 'correction_requested', 'escalated', 'closed']) {
    assert.ok(sql.includes("'" + status + "'"), 'report status ' + status + ' must be supported');
  }
  for (const status of ['supervisor_approved', 'submitted_to_dpdmis', 'allocated', 'dispatched', 'partially_received', 'received', 'returned_for_clarification']) {
    assert.ok(sql.includes("'" + status + "'"), 'indent status ' + status + ' must be supported');
  }
  assert.match(sql, /create or replace function app_private\.guard_report_transition/i);
  assert.match(sql, /create or replace function app_private\.guard_replenishment_transition/i);
  assert.match(sql, /create or replace function app_private\.record_report_event/i);
  assert.match(sql, /create or replace function app_private\.record_replenishment_event/i);
  assert.match(sql, /receipt_reference/i);
  assert.match(sql, /dpdmis_reference/i);
  assert.match(sql, /allocation_reference/i);
  assert.match(sql, /dispatch_reference/i);
  assert.match(sql, /purchase.order/i);
});

test('supervisors can correct extracted fields without rewriting original worker source', () => {
  const sql = loadMigration();
  assert.match(sql, /if new\.status is not distinct from old\.status then[\\s\\S]*?elsif v_role = 'supervisor' then/i);
  assert.match(sql, /grant update \(status, summary,/i);
  assert.match(sql, /new\.original_text is distinct from old\.original_text/i);
});

test('Chhattisgarh administrative and PMBJK reference data retain dated provenance', () => {
  const sql = loadMigration();
  assert.match(sql, /Ministry of Panchayati Raj/i);
  assert.match(sql, /21Oct2026/i);
  assert.match(sql, /2026-02-28/);
  assert.match(sql, /2026-06-30/);
  assert.match(sql, /352/);
  assert.match(sql, /mapping_review_required/i);
  assert.match(sql, /352/);
  assert.match(sql, /371/);
});
