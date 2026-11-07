const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('PostgreSQL integration bootstrap covers Supabase auth primitives and legacy BUSHO tables', () => {
  const sql = read('tests/postgres-bootstrap.sql');
  assert.match(sql, /create role anon/i);
  assert.match(sql, /create role authenticated/i);
  assert.match(sql, /create role service_role/i);
  assert.match(sql, /create schema auth/i);
  assert.match(sql, /create table auth\.users/i);
  assert.match(sql, /create or replace function auth\.uid\(\)/i);
  for (const table of [
    'facilities','workers','conversations','messages','reports','report_items',
    'inventory_items','inventory_snapshots','replenishment_requests','ai_runs','audit_logs'
  ]) assert.match(sql, new RegExp('create table public\\.' + table + '\\b', 'i'), table);
});

test('PostgreSQL integration contract exercises worker, supervisor, admin and stock hand-offs', () => {
  const sql = read('tests/postgres-rls-contract.sql');
  for (const value of [
    'worker_report_created',
    'submitted',
    'supervisor_verified',
    'report_fields_updated',
    'recommended_to_facility_store',
    'supervisor_approved',
    'submitted_to_dpdmis',
    'DPDMIS-TEST-001'
  ]) assert.ok(sql.toLowerCase().includes(value.toLowerCase()), value);
  assert.match(sql, /set local role authenticated|set role authenticated/i);
  assert.match(sql, /request\.jwt\.claim\.sub/i);
  assert.match(sql, /assert|raise exception/i);
});

test('CI runs the real migration against PostgreSQL 17 before declaring database contracts valid', () => {
  const workflow = read('.github/workflows/ci.yml');
  assert.match(workflow, /database-contract:/i);
  assert.match(workflow, /postgres:17/i);
  assert.match(workflow, /20261106190000_busho_operational_security_foundation\.sql/i);
  assert.match(workflow, /20261107060000_busho_database_query_tuning\.sql/i);
  assert.match(workflow, /postgres-rls-contract\.sql/i);
});
