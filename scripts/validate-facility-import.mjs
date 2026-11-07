#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const FACILITY_TYPES = new Set(['aam_shc','phc','chc','district_hospital','sub_centre','other']);
const REQUIRED_HEADERS = ['external_registry_id','name','facility_type','district_lgd_code','block_lgd_code'];

export function parseCsv(input) {
  const source = String(input ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field);
      if (row.some(value => value.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  if (field.length || row.length) {
    row.push(field);
    if (row.some(value => value.trim() !== '')) rows.push(row);
  }
  if (!rows.length) throw new Error('CSV is empty.');
  const headers = rows.shift().map(value => value.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw new Error('CSV contains duplicate column headers.');
  const missing = REQUIRED_HEADERS.filter(header => !headers.includes(header));
  if (missing.length) throw new Error('CSV is missing required columns: ' + missing.join(', '));
  return rows.map((values, index) => {
    const result = { source_row: index + 2 };
    headers.forEach((header, column) => { result[header] = String(values[column] ?? '').trim(); });
    return result;
  });
}

function normaliseName(value) {
  return String(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateFacilityRows(rows, options = {}) {
  const directory = options.directory;
  if (!directory?.geography) throw new Error('A Chhattisgarh LGD directory is required.');
  const sourceAuthority = String(options.sourceAuthority || '').trim();
  const sourceDate = String(options.sourceDate || '').trim();
  const sourceUrl = String(options.sourceUrl || '').trim();
  if (sourceAuthority.length < 3 || sourceAuthority.length > 160) throw new Error('A source authority between 3 and 160 characters is required.');
  if (!validDate(sourceDate)) throw new Error('Source date must be a real YYYY-MM-DD date.');
  let url;
  try { url = new URL(sourceUrl); } catch { throw new Error('A valid HTTPS source URL is required.'); }
  if (url.protocol !== 'https:') throw new Error('Facility source URLs must use HTTPS.');

  const districts = new Map(directory.geography.districts.map(item => [String(item.code), item]));
  const blocks = new Map(directory.geography.blocks.map(item => [String(item.code), item]));
  const errors = [];
  const warnings = [];
  const records = [];
  const seenIds = new Map();
  const seenNames = new Map();

  const now = options.asOf ? new Date(options.asOf) : new Date();
  const ageDays = Math.floor((now.getTime() - new Date(sourceDate + 'T00:00:00Z').getTime()) / 86400000);
  if (ageDays > 365) warnings.push({ code: 'stale_source_snapshot', message: 'Source snapshot is more than 365 days old; manual verification is mandatory.' });
  if (ageDays < 0) errors.push({ code: 'future_source_date', message: 'Source date cannot be in the future.' });

  for (const row of rows || []) {
    const rowNumber = Number(row.source_row) || records.length + errors.length + 2;
    const externalId = String(row.external_registry_id || '').trim();
    const name = String(row.name || '').trim().replace(/\s+/g, ' ');
    const type = String(row.facility_type || '').trim().toLowerCase();
    const districtCode = String(row.district_lgd_code || '').trim();
    const blockCode = String(row.block_lgd_code || '').trim();

    if (!externalId || externalId.length > 120) {
      errors.push({ row: rowNumber, code: 'invalid_external_id', message: 'A stable source facility ID (maximum 120 characters) is required.' });
      continue;
    }
    if (name.length < 2 || name.length > 180) {
      errors.push({ row: rowNumber, code: 'invalid_name', message: 'Facility name must be between 2 and 180 characters.' });
      continue;
    }
    if (!FACILITY_TYPES.has(type)) {
      errors.push({ row: rowNumber, code: 'invalid_facility_type', message: 'Facility type is not in the BUSHO facility type vocabulary.' });
      continue;
    }
    const district = districts.get(districtCode);
    if (!district) {
      errors.push({ row: rowNumber, code: 'unknown_district', message: 'District LGD code ' + districtCode + ' is not in the current Chhattisgarh directory.' });
      continue;
    }
    let block = null;
    if (blockCode) {
      block = blocks.get(blockCode);
      if (!block) {
        errors.push({ row: rowNumber, code: 'unknown_block', message: 'Block LGD code ' + blockCode + ' is not in the current Chhattisgarh directory.' });
        continue;
      }
      const parentCodes = Array.isArray(block.districtCodes) ? block.districtCodes.map(String) : [String(block.districtCode)];
      if (!parentCodes.includes(districtCode)) {
        errors.push({ row: rowNumber, code: 'block_district_mismatch', message: 'Block ' + blockCode + ' does not map to district ' + districtCode + '.' });
        continue;
      }
    }

    const previousIdRow = seenIds.get(externalId);
    if (previousIdRow) {
      errors.push({ row: rowNumber, code: 'duplicate_external_id', message: 'External facility ID duplicates row ' + previousIdRow + '.' });
      continue;
    }
    seenIds.set(externalId, rowNumber);

    const nameKey = [districtCode, type, normaliseName(name)].join('|');
    const previousNameRow = seenNames.get(nameKey);
    if (previousNameRow) {
      errors.push({ row: rowNumber, code: 'possible_duplicate_facility', message: 'Normalised facility name/type/district duplicates row ' + previousNameRow + '.' });
      continue;
    }
    seenNames.set(nameKey, rowNumber);

    const reviewFlags = [];
    if (block?.mappingReviewRequired) reviewFlags.push('block_parent_mapping_requires_review');
    if (block?.isSelectable === false) reviewFlags.push('block_not_selectable');
    records.push({
      external_registry_id: externalId,
      name,
      state_lgd_code: String(directory.geography.stateCode),
      district_lgd_code: districtCode,
      block_lgd_code: blockCode || null,
      facility_type: type,
      registry_source: sourceAuthority,
      registry_source_date: sourceDate,
      verification_status: 'needs_review',
      is_synthetic: false,
      is_active: true,
      review_flags: reviewFlags,
      source_row: rowNumber
    });
  }

  return {
    ok: errors.length === 0,
    summary: {
      input_rows: (rows || []).length,
      accepted_for_review: records.length,
      rejected_rows: errors.length,
      warning_count: warnings.length
    },
    provenance: {
      authority: sourceAuthority,
      source_date: sourceDate,
      source_url: url.toString(),
      administrative_directory_source_date: directory.geography.sourceDate
    },
    records,
    errors,
    warnings
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) throw new Error('Unexpected argument: ' + argv[i]);
    const key = argv[i].slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error('Missing value for --' + key);
    args[key] = value;
    i += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input || !args.source || !args['source-date'] || !args['source-url'] || !args.output) {
    throw new Error('Usage: node scripts/validate-facility-import.mjs --input facilities.csv --source "Source authority" --source-date YYYY-MM-DD --source-url https://... --output staged-facilities.json');
  }
  const directoryPath = resolve(args.directory || 'data/chhattisgarh-directory.json');
  const [csv, directoryText] = await Promise.all([
    readFile(resolve(args.input), 'utf8'),
    readFile(directoryPath, 'utf8')
  ]);
  const result = validateFacilityRows(parseCsv(csv), {
    directory: JSON.parse(directoryText),
    sourceAuthority: args.source,
    sourceDate: args['source-date'],
    sourceUrl: args['source-url']
  });
  await writeFile(resolve(args.output), JSON.stringify(result, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify(result.summary, null, 2) + '\n');
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  });
}
