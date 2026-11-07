import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateMedicineCatalogue } from '../scripts/validate-medicine-catalogue.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sample = JSON.parse(readFileSync(join(root, 'data/medicine-catalogue/chhattisgarh-edl-2025-sample.json'), 'utf8'));

test('medicine source sample passes provenance and row-structure validation', () => {
  const result = validateMedicineCatalogue(sample);
  assert.equal(result.ok, true);
  assert.equal(result.summary.source_entries, 24);
  assert.equal(result.import_policy.safe_to_import_to_live, false);
  assert.equal(result.import_policy.safe_for_stock_or_prescribing, false);
  assert.ok(result.warnings.some(message => message.includes('incomplete catalogue')));
});

test('medicine source validator rejects duplicate source rows and facility-level mismatches', () => {
  const duplicate = structuredClone(sample);
  duplicate.entries.push({ ...duplicate.entries[0] });
  const duplicateResult = validateMedicineCatalogue(duplicate);
  assert.ok(duplicateResult.errors.some(error => error.code === 'duplicate_source_item_number'));

  const mismatch = structuredClone(sample);
  mismatch.entries[0].facilityLevel = 'shc_aam';
  const mismatchResult = validateMedicineCatalogue(mismatch);
  assert.ok(mismatchResult.errors.some(error => error.code === 'annexure_facility_level_mismatch'));
});

test('medicine source validator rejects guessed normalized fields and incomplete flag removal', () => {
  const normalized = structuredClone(sample);
  normalized.entries[0].stockUnit = 'tablets';
  assert.ok(validateMedicineCatalogue(normalized).errors.some(error => error.code === 'unreviewed_normalized_fields'));

  const falselyComplete = structuredClone(sample);
  falselyComplete.sampleOnly = false;
  assert.ok(validateMedicineCatalogue(falselyComplete).errors.some(error => error.code === 'sample_status_missing'));
});

test('medicine source validator checks exact printed-page mapping and refuses incomplete full-release claims', () => {
  const wrongPage = structuredClone(sample);
  wrongPage.entries.find(entry => entry.facilityLevel === 'phc_aam' && entry.sourceItemNumber === 66).sourcePage = 50;
  assert.ok(validateMedicineCatalogue(wrongPage).errors.some(error => error.code === 'source_page_item_mismatch'));

  const claimedComplete = structuredClone(sample);
  claimedComplete.sampleOnly = false;
  const result = validateMedicineCatalogue(claimedComplete);
  assert.ok(result.errors.some(error => error.code === 'annexure_sequence_incomplete'));
});
