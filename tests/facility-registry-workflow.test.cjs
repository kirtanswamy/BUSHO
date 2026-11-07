const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('facility registry migration creates provenance-backed batch and candidate tables', () => {
  const sql = read('supabase/migrations/20261107170000_facility_registry_review_workflow.sql');
  assert.match(sql, /create table if not exists public\.facility_registry_import_batches/i);
  assert.match(sql, /create table if not exists public\.facility_registry_candidates/i);
  assert.match(sql, /source_authority text not null/i);
  assert.match(sql, /source_date date not null/i);
  assert.match(sql, /source_url text not null check \(source_url ~\* '\^https:\/\/'\)/i);
  assert.match(sql, /verification_status text not null default 'needs_review'/i);
  assert.match(sql, /is_synthetic/i);
  assert.match(sql, /unique index if not exists facilities_external_registry_id_unique/i);
});

test('facility staging and review tables are inaccessible to browser roles', () => {
  const sql = read('supabase/migrations/20261107170000_facility_registry_review_workflow.sql');
  assert.match(sql, /alter table public\.facility_registry_import_batches enable row level security/i);
  assert.match(sql, /alter table public\.facility_registry_candidates enable row level security/i);
  assert.match(sql, /revoke all privileges on public\.facility_registry_import_batches from anon, authenticated/i);
  assert.match(sql, /revoke all privileges on public\.facility_registry_candidates from anon, authenticated/i);
  assert.match(sql, /grant all privileges on public\.facility_registry_candidates to service_role/i);
});

test('server-side staging validates active administrator scope, batch size and LGD mappings', () => {
  const sql = read('supabase/migrations/20261107170000_facility_registry_review_workflow.sql');
  assert.match(sql, /create or replace function app_private\.stage_facility_registry_candidates/i);
  assert.match(sql, /v_batch\.received_rows \+ v_count > v_batch\.expected_rows/i);
  assert.match(sql, /public\.user_scope_assignments/i);
  assert.match(sql, /mapping_review_required/i);
  assert.match(sql, /block_parent_mapping_requires_review/i);
  assert.match(sql, /stale_source_snapshot/i);
  assert.match(sql, /source_row/i);
});

test('facility verification is transactional, scoped, deduplicated and auditable', () => {
  const sql = read('supabase/migrations/20261107170000_facility_registry_review_workflow.sql');
  assert.match(sql, /create or replace function app_private\.review_facility_registry_candidate/i);
  assert.match(sql, /An active authorised administrator is required/i);
  assert.match(sql, /create or replace function public\\.create_facility_registry_import_batch/i);
  assert.match(sql, /Candidate is outside the reviewer geographic scope/i);
  assert.match(sql, /Resolve all mapping and data-quality flags/i);
  assert.match(sql, /facilities_external_registry_id_unique/i);
  assert.match(sql, /facility_registry_candidate_verified/i);
  assert.match(sql, /facility_registry_candidate_rejected/i);
  assert.match(sql, /verification_status = 'verified'/i);
});

test('facility batch cannot complete with unstaged or unreviewed source rows', () => {
  const sql = read('supabase/migrations/20261107170000_facility_registry_review_workflow.sql');
  assert.match(sql, /create or replace function app_private\.complete_facility_registry_batch/i);
  assert.match(sql, /v_batch\.received_rows <> v_batch\.expected_rows/i);
  assert.match(sql, /v_pending > 0/i);
  assert.match(sql, /status = 'completed', completed_at = now\(\)/i);
});

test('only the service role can invoke facility staging, review and completion RPCs', () => {
  const sql = read('supabase/migrations/20261107170000_facility_registry_review_workflow.sql');
  for (const fn of ['stage_facility_registry_candidates','review_facility_registry_candidate','complete_facility_registry_batch']) {
    assert.match(sql, new RegExp('revoke all on function public\\.' + fn + '[\\s\\S]*?from public, anon, authenticated', 'i'));
    assert.match(sql, new RegExp('grant execute on function public\\.' + fn + '[\\s\\S]*?to service_role', 'i'));
  }
});

test('facility registry Edge Function rechecks auth and role, limits chunk sizes and uses server RPCs', () => {
  const source = read('supabase/functions/facility-registry/index.ts');
  assert.match(source, /withSupabase\(\{ auth: 'user' \}/);
  assert.match(source, /ctx\.userClaims\?\.id/);
  assert.match(source, /ctx\.supabaseAdmin/);
  assert.match(source, /platform_admin','state_admin','district_admin/);
  assert.match(source, /1_000_000/);
  assert.match(source, /input\.candidates\.length > 250/);
  assert.match(source, /stage_facility_registry_candidates/);
  assert.match(source, /review_facility_registry_candidate/);
  assert.match(source, /complete_facility_registry_batch/);
  assert.match(source, /BUSHO_ALLOWED_ORIGINS/);
});

test('facility registry UI uses the authenticated client, paginates and requires human review notes', () => {
  const html = read('admin.html');
  const js = read('admin-facility-registry.js');
  assert.match(html, /facility-import-form/);
  assert.match(html, /facility-source-authority/);
  assert.match(html, /facility-source-date/);
  assert.match(html, /facility-source-url/);
  assert.match(js, /manageFacilityRegistry/);
  assert.match(js, /stage_candidates/);
  assert.match(js, /review_candidate/);
  assert.match(js, /minimum 8 characters/);
  assert.match(js, /Verify and add facility/);
  assert.match(js, /Reject candidate/);
  assert.match(js, /facility-page-next/);
  assert.doesNotMatch(js, /localStorage|sessionStorage/);
});
