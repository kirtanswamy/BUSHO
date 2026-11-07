import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv, validateFacilityRows } from '../scripts/validate-facility-import.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const directory = JSON.parse(readFileSync(join(root, 'data/chhattisgarh-directory.json'), 'utf8'));
const district = directory.geography.districts.find(item =>
  directory.geography.blocks.some(block => block.districtCode === item.code && !block.mappingReviewRequired)
);
const block = directory.geography.blocks.find(item => item.districtCode === district.code && !item.mappingReviewRequired);
const options = {
  directory,
  sourceAuthority: 'Government facility master fixture',
  sourceDate: '2026-10-15',
  sourceUrl: 'https://health.example.gov.in/facilities',
  asOf: '2026-11-07T00:00:00Z'
};

function row(overrides = {}) {
  return {
    source_row: 2,
    external_registry_id: 'SRC-001',
    name: 'Primary Health Centre Example',
    facility_type: 'phc',
    district_lgd_code: district.code,
    block_lgd_code: block.code,
    ...overrides
  };
}

test('CSV parser supports quoted commas, escaped quotes, BOM and CRLF', () => {
  const rows = parseCsv('\uFEFFexternal_registry_id,name,facility_type,district_lgd_code,block_lgd_code\r\nSRC-1,"PHC, ""North""",phc,646,3708\r\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'PHC, "North"');
  assert.equal(rows[0].external_registry_id, 'SRC-1');
});

test('CSV parser rejects duplicate headers and unterminated quoted fields', () => {
  assert.throws(() => parseCsv('name,name,external_registry_id,facility_type,district_lgd_code,block_lgd_code\na,b,c,d,e,f'), /duplicate column/i);
  assert.throws(() => parseCsv('external_registry_id,name,facility_type,district_lgd_code,block_lgd_code\n1,"broken,phc,646,3708'), /unterminated/i);
});

test('valid facility candidate is staged as needs_review, never auto-verified', () => {
  const result = validateFacilityRows([row()], options);
  assert.equal(result.ok, true);
  assert.equal(result.summary.accepted_for_review, 1);
  assert.equal(result.records[0].state_lgd_code, '22');
  assert.equal(result.records[0].district_lgd_code, district.code);
  assert.equal(result.records[0].block_lgd_code, block.code);
  assert.equal(result.records[0].verification_status, 'needs_review');
  assert.equal(result.records[0].is_synthetic, false);
  assert.equal(result.records[0].is_active, true);
  assert.equal(result.provenance.source_url, options.sourceUrl);
});

test('facility candidates with unknown district, unknown block or mismatched block parent are rejected', () => {
  const unknownDistrict = validateFacilityRows([row({ district_lgd_code: '999999' })], options);
  assert.equal(unknownDistrict.ok, false);
  assert.equal(unknownDistrict.errors[0].code, 'unknown_district');

  const unknownBlock = validateFacilityRows([row({ block_lgd_code: '999999' })], options);
  assert.equal(unknownBlock.errors[0].code, 'unknown_block');

  const otherDistrict = directory.geography.districts.find(item => item.code !== district.code);
  const mismatch = validateFacilityRows([row({ district_lgd_code: otherDistrict.code })], options);
  assert.equal(mismatch.errors[0].code, 'block_district_mismatch');
});

test('facility import rejects duplicate external IDs and possible duplicate names', () => {
  const duplicateId = validateFacilityRows([row(), row({ source_row: 3, name: 'Another Facility' })], options);
  assert.equal(duplicateId.errors[0].code, 'duplicate_external_id');

  const duplicateName = validateFacilityRows([
    row(),
    row({ source_row: 3, external_registry_id: 'SRC-002', name: ' primary health centre example ' })
  ], options);
  assert.equal(duplicateName.errors[0].code, 'possible_duplicate_facility');
});

test('facility source metadata must be attributable, HTTPS and date-valid', () => {
  assert.throws(() => validateFacilityRows([row()], { ...options, sourceAuthority: '' }), /source authority/i);
  assert.throws(() => validateFacilityRows([row()], { ...options, sourceDate: '2026-02-30' }), /YYYY-MM-DD/i);
  assert.throws(() => validateFacilityRows([row()], { ...options, sourceUrl: 'http://example.gov.in' }), /HTTPS/i);
});

test('stale source snapshots are flagged and ambiguous block-parent mappings stay review-only', () => {
  const stale = validateFacilityRows([row()], { ...options, sourceDate: '2024-08-12' });
  assert.ok(stale.warnings.some(item => item.code === 'stale_source_snapshot'));
  const ambiguousBlock = directory.geography.blocks.find(item => item.mappingReviewRequired);
  const ambiguousDistrict = ambiguousBlock.districtCodes[0];
  const ambiguous = validateFacilityRows([row({
    external_registry_id: 'SRC-AMBIG',
    district_lgd_code: ambiguousDistrict,
    block_lgd_code: ambiguousBlock.code
  })], options);
  assert.equal(ambiguous.records[0].verification_status, 'needs_review');
  assert.ok(ambiguous.records[0].review_flags.includes('block_parent_mapping_requires_review'));
});
