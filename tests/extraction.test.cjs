const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'app-v2.js'), 'utf8');
const start = source.indexOf('const MEDICINE_CATALOG = [');
const end = source.indexOf('\nfunction renderExtraction()', start);
assert.notEqual(start, -1, 'clinical catalogs should exist');
assert.notEqual(end, -1, 'clinical extraction helpers should have a clear boundary');
const clinicalSource = source.slice(start, end);

function runExtraction(input) {
  const calls = { rendered: 0, saved: 0, toasts: [], focused: false };
  const context = {
    reportInput: { value: input, focus() { calls.focused = true; } },
    state: { rawReport: '', extracted: false, confirmed: false, draft: [], replenishment: { status: 'none', medicineId: null, source: null } },
    normalizeDigits(value) { return String(value).replace(/[०-९]/g, d => '०१२३४५६७८९'.indexOf(d)); },
    t(key) { return key; },
    renderAll() { calls.rendered += 1; },
    saveState() { calls.saved += 1; },
    showToast(message) { calls.toasts.push(message); },
    calls
  };
  vm.createContext(context);
  vm.runInContext(clinicalSource, context);
  vm.runInContext('makeExtraction()', context);
  return { state: context.state, calls };
}

test('recognises medicine generic names and brand aliases independent of interface language', () => {
  const { state } = runExtraction('We have 10 tablets of Dolo (paracetamol) left and 2 strips of cetirizine remaining.');
  const rows = state.draft.find(x => x.id === 'medicine-table').rows;
  assert.ok(rows.some(x => x.name === 'Paracetamol' && x.quantity === '10' && x.unit === 'tablets'));
  assert.ok(rows.some(x => x.name === 'Cetirizine' && x.quantity === '2' && x.unit === 'strips'));
});

test('recognises common disease terms and associates patient counts', () => {
  const { state } = runExtraction('Today 12 patients had malaria and 6 patients had dengue.');
  const rows = state.draft.find(x => x.id === 'disease-table').rows;
  assert.ok(rows.some(x => x.name === 'Malaria' && x.patients === '12'));
  assert.ok(rows.some(x => x.name === 'Dengue' && x.patients === '6'));
});

test('flags a medicine with no stated quantity instead of inventing stock', () => {
  const { state } = runExtraction('Paracetamol is available at the facility.');
  const row = state.draft.find(x => x.id === 'medicine-table').rows[0];
  assert.equal(row.name, 'Paracetamol');
  assert.equal(row.quantity, '');
  assert.match(row.stockStatus, /not stated/i);
});

test('supports Hindi disease and medicine mentions with native numerals', () => {
  const { state } = runExtraction('आज १२ मरीजों को मलेरिया हुआ। पैरासिटामोल की २० गोलियां बची हैं।');
  const disease = state.draft.find(x => x.id === 'disease-table').rows;
  const medicines = state.draft.find(x => x.id === 'medicine-table').rows;
  assert.ok(disease.some(x => x.name === 'Malaria' && x.patients === '12'));
  assert.ok(medicines.some(x => x.name === 'Paracetamol' && x.quantity === '20'));
});

test('supports empty report validation and keeps extraction provisional', () => {
  const empty = runExtraction('   ');
  assert.equal(empty.state.extracted, false);
  assert.equal(empty.calls.saved, 0);
  assert.equal(empty.calls.focused, true);

  const valid = runExtraction('5 patients with fever; 10 paracetamol tablets left.');
  assert.equal(valid.state.extracted, true);
  assert.equal(valid.state.confirmed, false);
  assert.equal(valid.state.draft.length, 3);
  assert.equal(valid.calls.saved, 1);
  assert.equal(valid.calls.rendered, 1);
});
