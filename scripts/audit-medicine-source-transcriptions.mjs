#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const EXPECTED = {
  phc_phc_aam_uphc: { facilityLevel: 'phc_aam', rows: 172, firstPage: 48, lastPage: 53, pageForItem: n => n <= 25 ? 48 : n <= 55 ? 49 : n <= 84 ? 50 : n <= 118 ? 51 : n <= 150 ? 52 : 53 },
  shc_aam: { facilityLevel: 'shc_aam', rows: 106, firstPage: 54, lastPage: 57, pageForItem: n => n <= 19 ? 54 : n <= 47 ? 55 : n <= 85 ? 56 : 57 }
};

const TEXT_REVIEW_PATTERNS = [
  { code: 'possible_truncated_unit_or_ocr', pattern: /\b\d+(?:\.\d+)?\s*(?:mg\/5\s*m\b|mg\/m\b|mcg\/m\b|mg\/ml\s*$/i },
  { code: 'source_spelling_or_ocr_check', pattern: /\b(?:Asprin|solvant|paradicholorobenzene|Medroxprogesterone|Drotavarin|Gama Benzene)\b/i },
  { code: 'programme_reference_not_sku', pattern: /\b(?:as per|according to)\s+(?:current\s+)?(?:program|programme|national|NVBDCP)/i }
];

export function auditMedicineTranscriptions(documents) {
  const errors = [];
  const entries = [];
  const seen = new Set();

  for (const doc of documents) {
    if (!doc || doc.schemaVersion !== 1 || !Array.isArray(doc.entries)) {
      errors.push({ code: 'invalid_transcription_document' });
      continue;
    }
    const key = Object.keys(doc.annexures || {})[0];
    const expected = EXPECTED[key];
    if (!expected) {
      errors.push({ code: 'unknown_annexure_document', annexure: key || null });
      continue;
    }
    if (doc.sampleOnly !== true) errors.push({ code: 'unreviewed_transcription_must_remain_sample_only', annexure: key });
    if (doc.transcriptionStatus !== 'transcribed_from_pdf_text_unreviewed') {
      errors.push({ code: 'transcription_review_status_missing', annexure: key });
    }
    if (doc.entries.length !== expected.rows) {
      errors.push({ code: 'source_row_count_mismatch', annexure: key, expected: expected.rows, actual: doc.entries.length });
    }

    const rowNumbers = doc.entries.map(entry => entry.sourceItemNumber).sort((a, b) => a - b);
    for (let index = 0; index < rowNumbers.length; index++) {
      if (rowNumbers[index] !== index + 1) {
        errors.push({ code: 'source_row_sequence_gap_or_duplicate', annexure: key, expected: index + 1, actual: rowNumbers[index] });
        break;
      }
    }

    for (const entry of doc.entries) {
      const identity = key + ':' + entry.sourceItemNumber;
      if (seen.has(identity)) errors.push({ code: 'duplicate_cross_file_source_row', annexure: key, item: entry.sourceItemNumber });
      seen.add(identity);
      if (entry.facilityLevel !== expected.facilityLevel) errors.push({ code: 'facility_level_mismatch', annexure: key, item: entry.sourceItemNumber });
      if (entry.sourceAnnexure !== key) errors.push({ code: 'stable_annexure_key_mismatch', annexure: key, item: entry.sourceItemNumber });
      if (!Number.isInteger(entry.sourcePage) || entry.sourcePage < expected.firstPage || entry.sourcePage > expected.lastPage) {
        errors.push({ code: 'printed_page_out_of_range', annexure: key, item: entry.sourceItemNumber });
      } else if (entry.sourcePage !== expected.pageForItem(entry.sourceItemNumber)) {
        errors.push({ code: 'printed_page_item_mapping_mismatch', annexure: key, item: entry.sourceItemNumber, expectedPage: expected.pageForItem(entry.sourceItemNumber), actualPage: entry.sourcePage });
      }
      if (!String(entry.sourceDescription || '').trim()) errors.push({ code: 'empty_source_description', annexure: key, item: entry.sourceItemNumber });
      if (entry.normalizedName || entry.dosageForm || entry.strength || entry.stockUnit) {
        errors.push({ code: 'premature_normalization_present', annexure: key, item: entry.sourceItemNumber });
      }

      const flags = TEXT_REVIEW_PATTERNS
        .filter(rule => rule.pattern.test(String(entry.sourceDescription || '')))
        .map(rule => rule.code);
      entries.push({
        annexure: key,
        item: entry.sourceItemNumber,
        printed_page: entry.sourcePage,
        source_description: entry.sourceDescription,
        transcription_flags: flags,
        mandatory_human_review: true,
        normalized_fields_allowed: false
      });
    }
  }

  return {
    ok: errors.length === 0,
    status: 'source_text_transcription_audit_only',
    summary: {
      total_source_rows: entries.length,
      expected_source_rows: 278,
      transcription_flagged_rows: entries.filter(entry => entry.transcription_flags.length > 0).length,
      mandatory_human_review_rows: entries.length,
      error_count: errors.length
    },
    import_policy: {
      safe_to_import_to_live: false,
      safe_for_stock_or_prescribing: false,
      normalized_fields_allowed: false
    },
    errors,
    entries
  };
}

async function main() {
  const phcPath = process.argv[2];
  const shcPath = process.argv[3];
  const outputPath = process.argv[4];
  if (!phcPath || !shcPath || !outputPath) {
    throw new Error('Usage: node scripts/audit-medicine-source-transcriptions.mjs phc.json shc.json audit-report.json');
  }
  const [phc, shc] = await Promise.all([
    readFile(resolve(phcPath), 'utf8').then(JSON.parse),
    readFile(resolve(shcPath), 'utf8').then(JSON.parse)
  ]);
  const result = auditMedicineTranscriptions([phc, shc]);
  await writeFile(resolve(outputPath), JSON.stringify(result, null, 2) + '\\n', 'utf8');
  process.stdout.write(JSON.stringify(result.summary, null, 2) + '\\n');
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(error => { process.stderr.write(error.message + '\\n'); process.exitCode = 1; });
}
