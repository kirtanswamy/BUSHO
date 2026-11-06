const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

test('public landing page loads the refreshed stylesheet without changing the portal route', () => {
  assert.match(html, /href="landing-v4\.css\?v=\d+"/);
  assert.match(html, /href="signin\.html"/);
  assert.equal((html.match(/<h1[\s>]/gi) || []).length, 1);
});

test('public landing page keeps its core reporting and safety story', () => {
  for (const id of ['workflow', 'platform', 'principles', 'faq', 'portals']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /data-i18n="lp\.preview\.synthetic"/);
  assert.match(html, /data-i18n="lp\.principles\.one\.title"/);
  assert.match(html, /data-i18n="lp\.faq\.q6"/);
  assert.match(html, /privacy\.html/);
  assert.match(html, /terms\.html/);
});

test('refreshed landing styles include mobile, keyboard and reduced-motion treatments', () => {
  const css = readFileSync(join(root, 'landing-v4.css'), 'utf8');
  assert.match(css, /@media\s*\(max-width:\s*850px\)/);
  assert.match(css, /@media\s*\(max-width:\s*560px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.lp-product-window/);
  assert.match(css, /\.lp-tagline/);
});
