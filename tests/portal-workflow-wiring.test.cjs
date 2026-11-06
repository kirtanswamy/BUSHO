const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('both portals load one shared operational store and no duplicate reporting bridge', () => {
  for (const page of ['worker.html', 'supervisor.html']) {
    const html = read(page);
    assert.match(html, /directory-data\.js\?v=1/);
    assert.match(html, /workflow-store\.js\?v=2/);
    assert.match(html, /portal-notifications\.js\?v=1/);
    assert.match(html, /workflow-ui\.js\?v=1/);
    assert.doesNotMatch(html, /portal-enhancements\.js/);
    assert.match(html, /portal-operations\.css/);
  }
});

test('worker confirmation emits the structured report into the shared workflow', () => {
  const source = read('app-v2.js');
  assert.match(source, /busho:worker-report-confirmed/);
  assert.match(source, /rawText:\s*state\.rawReport/);
  assert.match(source, /draft:\s*JSON\.parse\(JSON\.stringify\(state\.draft\)\)/);
});

test('supervisor operational panels are rendered from the shared store and directory', () => {
  const source = read('workflow-ui.js');
  for (const required of [
    'W.getReports()', 'W.getIndents()', 'W.getInventory()', 'W.getAuditLog()',
    'W.reviewReport(', 'W.createIndentDraft(', 'W.recordWarehouseIssue(',
    'W.recordDispatch(', 'W.recordReceipt(', 'W.recordConsumption(',
    'D.getBlocks()', 'data-module="reports"', 'data-module="facilities"'
  ]) assert.ok(source.includes(required), 'missing operational UI contract: ' + required);
  assert.doesNotMatch(source, /window\.alert\(/);
});

test('operational stylesheet includes responsive workflow and review components', () => {
  const css = read('portal-operations.css');
  for (const selector of ['.ops-record-card','.ops-timeline','.ops-table','.ops-supply-track','.ops-directory-summary','@media(max-width:560px)']) {
    assert.ok(css.includes(selector), 'missing style contract: ' + selector);
  }
});
