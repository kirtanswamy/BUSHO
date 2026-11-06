const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('Chhattisgarh directory contains all 33 districts and 146 development blocks', () => {
  const window = {};
  const context = { window, console };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'directory-data.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'directory-data.js' });

  const directory = window.BUSHO_DIRECTORY;
  assert.ok(directory, 'BUSHO_DIRECTORY is exposed');
  assert.equal(directory.getDistricts().length, 33);
  assert.equal(directory.getBlocks().length, 146);
  assert.equal(directory.getBlocks('dhamtari').length, 4);
  assert.equal(directory.getDemoFacility().blockId, 'dhamtari');
});

test('the administrative directory does not invent facility or worker totals', () => {
  const window = {};
  const context = { window, console };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'directory-data.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'directory-data.js' });

  const directory = window.BUSHO_DIRECTORY;
  assert.equal(directory.getFacilities().length, 1);
  assert.equal(directory.getFacilities()[0].synthetic, true);
  assert.equal(directory.getFacilityCountForBlock('dhamtari'), 1);
  assert.equal(directory.getFacilityCountForBlock('kurud'), 0);
  assert.equal(directory.getFacilityCountForBlock('raipur'), 0);
});
