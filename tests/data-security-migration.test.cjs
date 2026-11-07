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
  assert.match(sql, /if new\.status is not distinct from old\.status then[\s\S]*?elsif v_role = 'supervisor' then/i);
  assert.match(sql, /grant update \(status, summary,/i);
  assert.match(sql, /new\.original_text is distinct from old\.original_text/i);
});

test('Chhattisgarh administrative and PMBJK reference data retain dated provenance', () => {
  const sql = loadMigration();
  assert.match(sql, /Ministry of Panchayati Raj/i);
  assert.match(sql, /21Oct2026/i);
  assert.match(sql, /2026-02-28/);
  assert.match(sql, /2026-06-30/);
  assert.match(sql, /mapping_review_required/i);
  assert.match(sql, /352/);
  assert.match(sql, /371/);
});

test('report field edits and review-note changes are captured in the append-only timeline', () => {
  const sql = loadMigration();
  assert.match(sql, /new\.summary is distinct from old\.summary/i);
  assert.match(sql, /report_fields_updated/i);
  assert.match(sql, /after update of status,\s*summary,\s*review_note,\s*worker_response_note,[\s\S]*?on public\.reports/i);
});

test('indent reviewer attribution and recorded external references cannot be silently rewritten', () => {
  const sql = loadMigration();
  const guardStart = sql.indexOf('create or replace function app_private.guard_replenishment_transition');
  const guardEnd = sql.indexOf('create or replace function app_private.record_replenishment_event');
  assert.ok(guardStart >= 0 && guardEnd > guardStart, 'indent guard function must be present');
  const guard = sql.slice(guardStart, guardEnd);
  for (const field of [
    'created_by_user_id',
    'reviewed_by_user_id',
    'reviewed_at_user',
    'dpdmis_reference',
    'allocation_reference',
    'dispatch_reference',
    'data_mode'
  ]) {
    assert.match(guard, new RegExp('old\\.' + field + ' is distinct from new\\.' + field + '|new\\.' + field + ' is distinct from old\\.' + field, 'i'), field + ' must be immutable after it is recorded');
  }
  const grantsStart = sql.indexOf('revoke all privileges on all tables in schema public');
  const grantsEnd = sql.indexOf('-- 7. Row-level policies', grantsStart);
  const grants = sql.slice(grantsStart, grantsEnd);
  assert.doesNotMatch(grants, /grant update \([^)]*reviewed_by_user_id/i);
  assert.doesNotMatch(grants, /grant update \([^)]*reviewed_at_user/i);
});

test('default privileges do not expose future public tables or functions to browser roles', () => {
  const sql = loadMigration();
  assert.match(sql, /alter default privileges for role postgres in schema public/i);
  assert.match(sql, /revoke all on tables from anon, authenticated, service_role/i);
  assert.match(sql, /revoke all on sequences from anon, authenticated, service_role/i);
  assert.match(sql, /revoke all on functions from anon, authenticated, service_role/i);
  assert.match(sql, /alter default privileges for role postgres\s+revoke execute on functions from public/i);
});
test('workers can track only replenishment requests created from their own reports', () => {
  const sql = loadMigration();
  assert.match(sql, /create policy replenishment_requests_worker_select on public\.replenishment_requests/i);
  assert.match(sql, /r\.id = source_report_id/i);
  assert.match(sql, /r\.worker_id = app_private\.auth_worker_id\(\)/i);
});

test('hierarchical admins can read records in their assigned scope without receiving supervisor write permissions', () => {
  const sql = loadMigration();
  assert.match(sql, /workers_scoped_select[\s\S]*?district_admin[\s\S]*?state_admin/i);
  assert.match(sql, /reports_scoped_select[\s\S]*?district_admin[\s\S]*?state_admin/i);
  assert.match(sql, /replenishment_requests_scoped_select[\s\S]*?district_admin[\s\S]*?state_admin/i);
  assert.match(sql, /reports_supervisor_update[\s\S]*?current_profile_role\(\) = 'supervisor'/i);
});

test('workers can edit structured report items on drafts and reports returned for correction only', () => {
  const sql = loadMigration();
  for (const policy of [
    'report_items_worker_insert',
    'report_items_worker_update',
    'report_items_worker_delete'
  ]) {
    const start = sql.indexOf('create policy ' + policy);
    assert.ok(start >= 0, policy + ' policy must exist');
    const next = sql.indexOf('create policy ', start + 15);
    const body = sql.slice(start, next < 0 ? sql.length : next);
    assert.match(body, /r\\.status in \\(\'draft\',\'correction_requested\'\\)/i, policy + ' must allow returned corrections');
  }
});
