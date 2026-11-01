#!/usr/bin/env node
// Reports UI strings that still look untranslated (no native-script characters).
// Informational by default; pass --strict to exit 1 when any are found.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'i18n.js'), 'utf8');

const noop = () => {};
const win = {};
const sandbox = {
  window: win, localStorage: { getItem: () => null, setItem: noop },
  navigator: { language: 'en' }, document: { documentElement: {}, addEventListener: noop, querySelectorAll: () => [] },
  console
};
sandbox.globalThis = sandbox;
try { vm.runInNewContext(code, sandbox); } catch (e) { console.error('Could not load i18n.js:', e.message); process.exit(2); }
const locales = win.BUSHO_I18N || sandbox.BUSHO_I18N;
if (!locales || !locales.en) { console.error('window.BUSHO_I18N.en not found'); process.exit(2); }

const scripts = {
  hi: /[\u0900-\u097F]/, mr: /[\u0900-\u097F]/, ta: /[\u0B80-\u0BFF]/,
  te: /[\u0C00-\u0C7F]/, bn: /[\u0980-\u09FF]/
};
const keepLatin = ['BUSHO', 'ORS', 'HWC', 'CHO', 'AI', 'FAQ'];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = String(v);
  }
  return out;
}
const latinOnly = s => {
  let t = s;
  for (const w of keepLatin) t = t.split(w).join('');
  return /[A-Za-z]{3,}/.test(t.replace(/\{[^}]*\}/g, ''));
};

const en = flatten(locales.en);
let total = 0;
for (const [lang, re] of Object.entries(scripts)) {
  if (!locales[lang]) { console.log(`${lang}: MISSING locale`); total += 1; continue; }
  const flat = flatten(locales[lang]);
  const keys = Object.keys(en);
  const sus = keys.filter(k => latinOnly(en[k]) && (flat[k] === undefined || flat[k] === en[k] || (!re.test(flat[k]) && latinOnly(flat[k]))));
  total += sus.length;
  const pct = Math.round(100 * (1 - sus.length / keys.length));
  console.log(`${lang}: ${keys.length - sus.length}/${keys.length} strings look translated (${pct}%)` + (sus.length ? `; ${sus.length} look untranslated` : ''));
  sus.slice(0, 12).forEach(k => console.log(`    ${k}: "${(flat[k] ?? '(missing)').slice(0, 60)}"`));
  if (sus.length > 12) console.log(`    ... and ${sus.length - 12} more`);
}
console.log(total ? '\nSome strings still look untranslated.' : '\nAll locales contain native-script text for every translatable string.');
process.exit(process.argv.includes('--strict') && total ? 1 : 0);
