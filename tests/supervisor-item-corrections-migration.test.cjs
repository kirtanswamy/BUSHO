const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sql = fs.readFileSync(
  path.join(__dirname, '..', 'supabase/migrations/20261107051839_busho_supervisor_report_item_corrections.sql'),
  'utf8'
);

test('supervisor item updates are restricted to assigned reports awaiting review', () => {
  assert.match(sql, /create policy report_items_supervisor_update on public\.report_items/i);
  const policy = sql.match(/create policy report_items_supervisor_update[\s\S]*?;/i)?.[0] || '';
  assert.match(policy, /for update to authenticated/i);
  assert.match(policy, /current_profile_role\(\) = 'supervisor'/i);
  assert.match(policy, /has_facility_access\(r\.facility_id, array\['supervisor'\]/i);
  assert.match(policy, /r\.status in \('submitted','resubmitted'\)/i);
  assert.match(policy, /with check/i);
});

test('structured item corrections append metadata-only report events', () => {
  assert.match(sql, /create or replace function app_private\.record_report_item_correction/i);
  assert.match(sql, /security definer[\s\S]*?set search_path = ''/i);
  assert.match(sql, /create trigger busho_report_item_correction_event after update on public\.report_items/i);
  assert.match(sql, /'report_item_corrected'/i);
  assert.match(sql, /'changed_fields'/i);
  assert.match(sql, /revoke all on function app_private\.record_report_item_correction\(\)[\s\S]*?from public, anon, authenticated/i);
  const fn = sql.match(/create or replace function app_private\.record_report_item_correction[\s\S]*?\$\$;/i)?.[0] || '';
  assert.doesNotMatch(fn, /jsonb_build_object\([^)]*new\.(?:display_label|quantity|unit|value_text)/i);
  assert.doesNotMatch(fn, /new\.original_text/i);
});

test('policy and trigger can be reapplied without duplicate-object failures', () => {
  assert.match(sql, /drop policy if exists report_items_supervisor_update/i);
  assert.match(sql, /drop trigger if exists busho_report_item_correction_event/i);
});
