'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const htmlFiles = ['index.html','signin.html','set-password.html','admin.html','worker.html','supervisor.html','storekeeper.html','privacy.html','terms.html','accessibility.html'];

test('HTML image elements have an explicit alt attribute', () => {
  for (const file of htmlFiles) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(match[0], /\balt\s*=/i, file + ' contains an image without alt text');
    }
  }
});

test('primary pages retain skip links and visible keyboard focus styles', () => {
  const landing = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const landingCss = fs.readFileSync(path.join(root, 'landing-v3.css'), 'utf8');
  const portalCss = fs.readFileSync(path.join(root, 'styles-v2.css'), 'utf8');
  assert.match(landing, /class="lp-skip"[^>]*href="#main-content"/);
  assert.match(landingCss, /:focus-visible\s*\{/);
  assert.match(portalCss, /:focus-visible\s*\{/);
  assert.match(portalCss, /\.skip-link:focus/);
});

test('primary portal markup does not introduce positive tabindex values', () => {
  for (const file of ['index.html','admin.html','worker.html','supervisor.html','storekeeper.html']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /tabindex\s*=\s*["'](?:[1-9]\d*)["']/i, file + ' contains a positive tabindex');
  }
});
