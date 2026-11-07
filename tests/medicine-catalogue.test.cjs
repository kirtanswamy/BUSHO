const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261107200000_medicine_reference_catalogue.sql'), 'utf8');
const sample = JSON.parse(fs.readFileSync(path.join(root, 'data/medicine-catalogue/chhattisgarh-edl-2025-sample.json'), 'utf8'));

test('medicine catalogue preserves source release provenance and is read-only to browser roles', () => {
  assert.match(migration, /create table if not exists public\.medicine_catalogue_releases/i);
  assert.match(migration, /create table if not exists public\.medicine_catalogue_entries/i);
  assert.match(migration, /source_authority text not null/i);
  assert.match(migration, /source_date date not null/i);
  assert.match(migration, /source_url text not null check \(source_url ~\* '\^https:\/\/'\)/i);
  assert.match(migration, /source_description text not null/i);
  assert.match(migration, /parsing_status text not null default 'source_text_only'/i);
  assert.match(migration, /revoke all privileges on public\.medicine_catalogue_entries from anon, authenticated/i);
  assert.match(migration, /grant select on public\.medicine_catalogue_releases, public\.medicine_catalogue_entries to authenticated/i);
});

test('sample EDL transcription is explicitly partial and source-attributed', () => {
  assert.equal(sample.sampleOnly, true);
  assert.equal(sample.catalogue.version, '2025');
  assert.equal(sample.catalogue.status, 'reference_only');
  assert.equal(sample.catalogue.notificationDate, '2025-11-12');
  assert.equal(sample.annexures.phc_phc_aam_uphc.publishedEntryCount, 172);
  assert.equal(sample.annexures.shc_aam.publishedEntryCount, 106);
  assert.equal(sample.entries.length, 24);
  assert.equal(sample.entries.filter(entry => entry.facilityLevel === 'phc_aam').length, 12);
  assert.equal(sample.entries.filter(entry => entry.facilityLevel === 'shc_aam').length, 12);
  for (const entry of sample.entries) {
    assert.ok(entry.sourceDescription.length > 0);
    assert.ok(entry.sourceItemNumber > 0);
    assert.ok(entry.sourcePage > 0);
    assert.ok(['Annexure 4', 'Annexure 5'].includes(entry.sourceAnnexure));
  }
});

test('source item numbers are unique within each sample annexure', () => {
  const keys = sample.entries.map(entry => entry.sourceAnnexure + ':' + entry.sourceItemNumber);
  assert.equal(new Set(keys).size, keys.length);
});
