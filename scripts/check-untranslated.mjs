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
function findLocales(node, depth = 0, seen = new Set()) {
  if (!node || typeof node !== 'object' || seen.has(node) || depth > 4) return null;
  seen.add(node);
  if (node.en && typeof node.en === 'object' && ['hi', 'ta', 'te', 'bn', 'mr'].some(l => node[l])) return node;
  for (const v of Object.values(node)) {
    const found = findLocales(v, depth + 1, seen);
    if (found) return found;
  }
  return null;
}
const locales = findLocales(win) || findLocales(sandbox);
if (!locales) {
  console.error('Could not find the locale dictionaries (an object with en, hi, ta, te, bn, mr) after running i18n.js.');
  console.error('Globals set by i18n.js on window:', Object.keys(win).join(', ') || '(none)');
  for (const [k, v] of Object.entries(win)) if (v && typeof v === 'object') console.error(`  window.${k} keys:`, Object.keys(v).join(', '));
  console.error('If the dictionaries are private inside a closure, expose them, e.g. window.BUSHO_I18N = { en, hi, ta, te, bn, mr, ... }.');
  process.exit(2);
}

const scripts = {
  hi: /[\u0900-\u097F]/, mr: /[\u0900-\u097F]/, ta: /[\u0B80-\u0BFF]/,
  te: /[\u0C00-\u0C7F]/, bn: /[\u0980-\u09FF]/
};
const keepLatin = ['BUSHO', 'ORS', 'HWC', 'CHO', 'AI', 'FAQ', 'Rampur', 'Anita', 'Singh', 'PDF', 'SMS', 'OK'];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = String(v);
  }
  return out;
}
const stripKept = s => {
  let t = s.replace(/\{[^}]*\}/g, '');
  for (const w of keepLatin) t = t.split(w).join('');
  return t;
};
const latinWords = s => stripKept(s).match(/[A-Za-z]{3,}/g) || [];
const latinOnly = s => latinWords(s).length > 0;

const en = flatten(locales.en);
let total = 0;
for (const [lang, re] of Object.entries(scripts)) {
  if (!locales[lang]) { console.log(`${lang}: MISSING locale`); total += 1; continue; }
  const flat = flatten(locales[lang]);
  const keys = Object.keys(en);
  // "untranslated": missing, identical to English, or no native-script text at all.
  // "mixed": has native script but still contains 2+ English words (for example a native prefix plus English text).
  const sus = keys.filter(k => latinOnly(en[k]) && (flat[k] === undefined || flat[k] === en[k] || (!re.test(flat[k]) && latinOnly(flat[k]))));
  const mixed = keys.filter(k => !sus.includes(k) && flat[k] !== undefined && re.test(flat[k]) && latinWords(flat[k]).length >= 2);
  total += sus.length + mixed.length;
  const bad = sus.length + mixed.length;
  const pct = Math.round(100 * (1 - bad / keys.length));
  console.log(`${lang}: ${keys.length - bad}/${keys.length} strings look fully translated (${pct}%)` + (sus.length ? `; ${sus.length} untranslated` : '') + (mixed.length ? `; ${mixed.length} still mix in English words` : ''));
  sus.slice(0, 12).forEach(k => console.log(`    ${k}: "${(flat[k] ?? '(missing)').slice(0, 60)}"`));
  if (sus.length > 12) console.log(`    ... and ${sus.length - 12} more untranslated`);
  mixed.slice(0, 12).forEach(k => console.log(`    [mixed] ${k}: "${flat[k].slice(0, 70)}"`));
  if (mixed.length > 12) console.log(`    ... and ${mixed.length - 12} more mixed`);
}
console.log(total ? '\nSome strings are untranslated or still mix in English.' : '\nNo untranslated or English-mixed strings found.');
process.exit(process.argv.includes('--strict') && total ? 1 : 0);