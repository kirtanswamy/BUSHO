const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('browser Supabase config contains only the project URL and a public publishable key', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'supabase-config.js'), 'utf8');
  assert.match(source, /https:\/\/vufnjwkaaqtyukjcvknu\.supabase\.co/);
  assert.match(source, /sb_publishable_[A-Za-z0-9_-]+/);
  assert.doesNotMatch(source, /service_role|secret[_-]?key/i);
});
