#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ANNEXURES = {
  phc_phc_aam_uphc: {
    label: 'Annexure 4', level: 'phc_aam', minPage: 47, maxPage: 52,
    pageForItem: n => n <= 25 ? 47 : n <= 55 ? 48 : n <= 84 ? 49 : n <= 118 ? 50 : n <= 150 ? 51 : 52
  },
  shc_aam: {
    label: 'Annexure 5', level: 'shc_aam', minPage: 53, maxPage: 56,
    pageForItem: n => n <= 19 ? 53 : n <= 47 ? 54 : n <= 85 ? 55 : 56
  }
};

export function validateMedicineCatalogue(input) {
  const errors = [];
  const warnings = [];
  if (!input || input.schemaVersion !== 1) throw new Error('Unsupported medicine catalogue schema version.');
  const source = input.catalogue || {};
  if (!source.code || !source.name || !source.version) throw new Error('Catalogue code, name and version are required.');
  if (String(source.authority || '').trim().length < 3) throw new Error('A source authority is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source.notificationDate || '')) throw new Error('Notification date must use YYYY-MM-DD.');
  let url;
  try { url = new URL(source.sourceUrl); } catch { throw new Error('A valid source URL is required.'); }
  if (url.protocol !== 'https:') throw new Error('Medicine catalogue source URL must use HTTPS.');
  if (!source.sourceDocumentTitle) throw new Error('Source document title is required.');
  if (source.status !== 'reference_only') warnings.push('Catalogue source is not marked reference_only; confirm governance before staging.');

  const entries = Array.isArray(input.entries) ? input.entries : [];
  const seen = new Set();
  for (const [index, entry] of entries.entries()) {
    const row = index + 1;
    const annexure = ANNEXURES[entry.sourceAnnexure];
    if (!annexure) { errors.push({ row, code: 'unknown_annexure' }); continue; }
    if (entry.facilityLevel !== annexure.level) errors.push({ row, code: 'annexure_facility_level_mismatch' });
    if (entry.sourceAnnexureLabel !== annexure.label) errors.push({ row, code: 'annexure_label_mismatch' });
    const meta = input.annexures?.[annexure.key];
    if (!meta || meta.facilityLevel !== annexure.level) errors.push({ row, code: 'annexure_metadata_missing' });
    if (!Number.isInteger(entry.sourceItemNumber) || entry.sourceItemNumber < 1
      || (meta && entry.sourceItemNumber > meta.publishedEntryCount)) errors.push({ row, code: 'invalid_source_item_number' });
    if (!Number.isInteger(entry.sourcePage) || entry.sourcePage < annexure.minPage || entry.sourcePage > annexure.maxPage) {
      errors.push({ row, code: 'source_page_out_of_range' });
    } else if (Number.isInteger(entry.sourceItemNumber) && entry.sourcePage !== annexure.pageForItem(entry.sourceItemNumber)) {
      errors.push({ row, code: 'source_page_item_mismatch', expectedPage: annexure.pageForItem(entry.sourceItemNumber) });
    }
    if (!String(entry.sourceDescription || '').trim() || String(entry.sourceDescription).length > 2000) {
      errors.push({ row, code: 'invalid_source_description' });
    }
    if (entry.normalizedName || entry.dosageForm || entry.strength || entry.stockUnit) {
      errors.push({ row, code: 'unreviewed_normalized_fields', message: 'This importer accepts verbatim source rows only; normalized fields need a separate review workflow.' });
    }
    const key = entry.sourceAnnexure + ':' + entry.sourceItemNumber;
    if (seen.has(key)) errors.push({ row, code: 'duplicate_source_item_number' });
    seen.add(key);
  }

  for (const [key, meta] of Object.entries(input.annexures || {})) {
    const count = entries.filter(entry => entry.sourceAnnexure === key).length;
    if (count < Number(meta.publishedEntryCount || 0)) warnings.push(key + ': ' + count + ' of ' + meta.publishedEntryCount + ' source entries transcribed; incomplete catalogue.');
    if (count > Number(meta.publishedEntryCount || 0)) errors.push({ row: null, code: 'annexure_entry_count_exceeded', annexure: key });
  }
  if (typeof input.sampleOnly !== 'boolean') {
    errors.push({ row: null, code: 'sample_status_missing', message: 'Set sampleOnly=true for a partial transcription or false only after all source rows are transcribed.' });
  }
  if (input.sampleOnly === false) {
    for (const [key, meta] of Object.entries(input.annexures || {})) {
      const annexure = ANNEXURES[key];
      if (!annexure) continue;
      const actual = entries.filter(entry => entry.sourceAnnexure === key)
        .map(entry => entry.sourceItemNumber).sort((a, b) => a - b);
      const expected = Number(meta.publishedEntryCount || 0);
      if (actual.length !== expected || actual.some((number, index) => number !== index + 1)) {
        errors.push({ row: null, code: 'annexure_sequence_incomplete', annexure: key, expectedRows: expected, actualRows: actual.length });
      }
    }
  }

  return {
    ok: errors.length === 0,
    summary: { source_entries: entries.length, error_count: errors.length, warning_count: warnings.length },
    import_policy: {
      mode: 'verbatim_reference_staging_only',
      safe_to_import_to_live: false,
      safe_for_stock_or_prescribing: false,
      note: 'Validation checks provenance and source-row structure only. It does not validate clinical meaning, facility applicability, stock units or authorization.'
    },
    errors,
    warnings
  };
}

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) throw new Error('Usage: node scripts/validate-medicine-catalogue.mjs input.json output-validation.json');
  const input = JSON.parse(await readFile(resolve(inputPath), 'utf8'));
  const result = validateMedicineCatalogue(input);
  await writeFile(resolve(outputPath), JSON.stringify(result, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify(result.summary, null, 2) + '\n');
  if (!result.ok) process.exitCode = 1;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}
