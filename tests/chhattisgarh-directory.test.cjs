const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const directory = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'chhattisgarh-directory.json'), 'utf8'));

test('directory carries the Local Government Directory source date and full CG hierarchy', () => {
  assert.equal(directory.geography.stateCode, '22');
  assert.equal(directory.geography.blocks.length, 147);
  assert.equal(directory.geography.districts.length, 33);
  assert.equal(directory.geography.sourceDate, '21Oct2026');
  assert.ok(directory.geography.blocks.every(block => block.code && block.districtCode));
});

test('Dhamtari demo seed uses a real LGD block code and remains explicitly synthetic', () => {
  assert.ok(directory.geography.blocks.some(block => block.code === '3625' && block.name === 'Dhamtari'));
  assert.equal(directory.demoSeed.blockCode, '3625');
  assert.equal(directory.demoSeed.isSynthetic, true);
  assert.match(directory.demoSeed.facilityName, /synthetic demo/i);
});

test('Jan Aushadhi district counts reconcile to the published Chhattisgarh total', () => {
  const counts = directory.publicReferences.janaushadhi.districtCounts;
  assert.equal(directory.publicReferences.janaushadhi.asOf, '2026-02-28');
  assert.equal(Object.keys(counts).length, 33);
  assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), 352);
});
