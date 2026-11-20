'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('shared civic shell parses and is wired to every required public and role page', () => {
  assert.doesNotThrow(() => new vm.Script(read('civic-shell.js')));
  for (const file of ['index.html','signin.html','worker.html','supervisor.html','storekeeper.html']) {
    const html = read(file);
    assert.match(html, /civic-design-system\.css/);
    assert.match(html, /civic-shell\.js/);
  }
  assert.match(read('index.html'), /civic-landing\.css/);
  assert.match(read('index.html'), /class="lp-skip" href="#main-content"/);
});

test('civic design tokens cover the requested institutional palette and responsive/print modes', () => {
  const css = read('civic-design-system.css');
  for (const token of ['--civic-canvas:#F4F7FA','--civic-navy:#0B3D6B','--civic-utility:#072440','--civic-teal:#0F766E','--civic-amber:#C25E00']) {
    assert.ok(css.includes(token), 'missing token ' + token);
  }
  assert.match(css, /@media\(max-width:960px\)/);
  assert.match(css, /@media\(max-width:767px\)/);
  assert.match(css, /@media print/);
  assert.match(css, /\[data-contrast=high\]/);
  assert.doesNotMatch(read('civic-landing.css'), /#[0-9a-fA-F]{3,8}\b/, 'landing components must consume shared tokens');
});

test('stockout interface keeps the frozen system boundary and external indent confirmation guard', () => {
  const landing = read('index.html');
  const worker = read('worker.html');
  const custodian = read('storekeeper-stockouts.js');
  assert.match(landing, /Two controlled fulfilment branches/);
  assert.match(landing, /DPDMIS/);
  assert.match(landing, /CGMSC/);
  assert.match(landing, /No patient-identifiable data/);
  assert.match(worker, /verified parent PHC/i);
  assert.match(custodian, /confirmExternalSubmission/);
  assert.match(custodian, /required><span>I confirm that the authorised external submission has already occurred/);
});

test('authenticated role pages retain their original auth and operational controllers', () => {
  const worker = read('worker.html');
  const supervisor = read('supervisor.html');
  const storekeeper = read('storekeeper.html');
  for (const source of [worker, supervisor, storekeeper]) {
    assert.match(source, /role-auth\.js/);
    assert.match(source, /supabase-client\.js/);
  }
  assert.match(worker, /worker-stockouts\.js/);
  assert.match(supervisor, /supervisor-stockouts\.js/);
  assert.match(storekeeper, /storekeeper-stockouts\.js/);
});
