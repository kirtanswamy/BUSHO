import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateMedicineCatalogue } from '../scripts/validate-medicine-catalogue.mjs';
import { auditMedicineTranscriptions } from '../scripts/audit-medicine-source-transcriptions.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sample = JSON.parse(readFileSync(join(root, 'data/medicine-catalogue/chhattisgarh-edl-2025-sample.json'), 'utf8'));
const shcTranscription = JSON.parse(readFileSync(join(root, 'data/medicine-catalogue/chhattisgarh-edl-2025-shc-aam-source-transcription.json'), 'utf8'));
const phcTranscription = JSON.parse(readFileSync(join(root, 'data/medicine-catalogue/chhattisgarh-edl-2025-phc-aam-source-transcription.json'), 'utf8'));

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
  assert.ok(validateMedicineCatalogue(falselyComplete).errors.some(error => error.code === 'annexure_sequence_incomplete'));
});

test('medicine source validator checks exact printed-page mapping and refuses incomplete full-release claims', () => {
  const wrongPage = structuredClone(sample);
  wrongPage.entries.find(entry => entry.facilityLevel === 'phc_aam' && entry.sourceItemNumber === 66).sourcePage = 49;
  assert.ok(validateMedicineCatalogue(wrongPage).errors.some(error => error.code === 'source_page_item_mismatch'));

  const claimedComplete = structuredClone(sample);
  claimedComplete.sampleOnly = false;
  const result = validateMedicineCatalogue(claimedComplete);
  assert.ok(result.errors.some(error => error.code === 'annexure_sequence_incomplete'));
});

test('verified source page manifest covers every numbered entry exactly once', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'data/medicine-catalogue/chhattisgarh-edl-2025-source-manifest.json'), 'utf8'));
  for (const [key, meta] of Object.entries(manifest.annexures)) {
    let next = meta.firstItem;
    for (const range of meta.printedPageRanges) {
      assert.equal(range.firstItem, next);
      assert.ok(range.lastItem >= range.firstItem);
      next = range.lastItem + 1;
    }
    assert.equal(next - 1, meta.lastItem);
    assert.equal(meta.lastItem, key === 'phc_phc_aam_uphc' ? 172 : 106);
  }
  assert.equal(manifest.currentTranscription.complete, false);
  assert.equal(manifest.currentTranscription.phcRows, 10);
  assert.equal(manifest.currentTranscription.shcRows, 14);
});

test('SHC-AAM source transcription covers all 106 numbered rows with printed-page provenance', () => {
  const result = validateMedicineCatalogue(shcTranscription);
  assert.equal(result.ok, true);
  assert.equal(result.summary.source_entries, 106);
  assert.deepEqual(result.errors, []);
  assert.equal(shcTranscription.transcriptionStatus, 'transcribed_from_pdf_text_unreviewed');
  assert.equal(shcTranscription.entries[0].sourceItemNumber, 1);
  assert.equal(shcTranscription.entries.at(-1).sourceItemNumber, 106);
  assert.deepEqual(
    shcTranscription.entries.map(entry => entry.sourceItemNumber),
    Array.from({ length: 106 }, (_, index) => index + 1)
  );
  assert.ok(shcTranscription.entries.every(entry => entry.facilityLevel === 'shc_aam'));
  assert.ok(shcTranscription.entries.every(entry => !entry.normalizedName && !entry.dosageForm && !entry.strength && !entry.stockUnit));
});

test('PHC-AAM/UPHC source transcription covers all 172 numbered rows with printed-page provenance', () => {
  const result = validateMedicineCatalogue(phcTranscription);
  assert.equal(result.ok, true);
  assert.equal(result.summary.source_entries, 172);
  assert.deepEqual(result.errors, []);
  assert.equal(phcTranscription.transcriptionStatus, 'transcribed_from_pdf_text_unreviewed');
  assert.deepEqual(
    phcTranscription.entries.map(entry => entry.sourceItemNumber),
    Array.from({ length: 172 }, (_, index) => index + 1)
  );
  assert.ok(phcTranscription.entries.every(entry => entry.facilityLevel === 'phc_aam'));
  assert.ok(phcTranscription.entries.every(entry => !entry.normalizedName && !entry.dosageForm && !entry.strength && !entry.stockUnit));
});

test('transcription audit covers all 278 source rows and flags possible OCR issues without normalizing', () => {
  const report = auditMedicineTranscriptions([phcTranscription, shcTranscription]);
  assert.equal(report.ok, true);
  assert.equal(report.summary.total_source_rows, 278);
  assert.equal(report.summary.mandatory_human_review_rows, 278);
  assert.equal(report.import_policy.safe_to_import_to_live, false);
  assert.equal(report.import_policy.safe_for_stock_or_prescribing, false);
  const phcRow36 = report.entries.find(entry => entry.annexure === 'phc_phc_aam_uphc' && entry.item === 36);
  assert.ok(phcRow36.transcription_flags.includes('possible_truncated_unit_or_ocr'));
  const phcRow12 = report.entries.find(entry => entry.annexure === 'phc_phc_aam_uphc' && entry.item === 12);
  assert.ok(phcRow12.transcription_flags.includes('source_spelling_or_ocr_check'));
});
