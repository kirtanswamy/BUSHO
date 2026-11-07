const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('worker report state is isolated by authenticated user ID', () => {
  const app = read('app-v2.js');
  assert.match(app, /const STORAGE_PREFIX = 'busho-worker-state-v1:'/);
  assert.match(app, /localStorage\.getItem\(STORAGE_PREFIX \+ userId\)/);
  assert.match(app, /const key = STORAGE_PREFIX \+ activeAuthUserId/);
  assert.match(app, /localStorage\.setItem\(key/);
  assert.match(app, /busho:authenticated/);
  assert.match(app, /busho:unauthenticated/);
  const auth = read('role-auth.js');
  assert.match(auth, /document\.dispatchEvent\(new CustomEvent\('busho:authenticated'/);
  assert.match(auth, /document\.dispatchEvent\(new CustomEvent\('busho:unauthenticated'/);
  assert.doesNotMatch(app, /busho-demo-state-v1/);
});

test('worker confirmation calls the persistence coordinator and waits for server acknowledgement', () => {
  const app = read('app-v2.js');
  assert.match(app, /async function confirmReport\(\)/);
  assert.match(app, /persistence\.persistConfirmedReport\(/);
  assert.match(app, /onDraftCreated: async reportId =>/);
  assert.match(app, /persistState\(\)/);
  assert.match(app, /state\.serverStatus = result\.report\.status/);
  assert.match(app, /state\.confirmed = true/);
  assert.match(app, /Submission not confirmed/);
});

test('worker portal loads the persistence adapter before the app and auth gate', () => {
  const html = read('worker.html');
  const persistence = html.indexOf('report-persistence.js');
  const app = html.indexOf('app-v2.js');
  const auth = html.indexOf('role-auth.js');
  assert.ok(persistence >= 0 && persistence < app && app < auth);
});

test('worker portal no longer seeds synthetic activity or enables the local cross-role bridge by default', () => {
  const html = read('worker.html');
  const enhancements = read('portal-enhancements.js');
  assert.doesNotMatch(html, /Routine facility update|Weekly field summary|Demo activity/);
  assert.match(enhancements, /window\.BUSHO_ENABLE_SYNTHETIC_REPORT_BRIDGE === true/);
  assert.match(enhancements, /Live report history will appear here/);
});
