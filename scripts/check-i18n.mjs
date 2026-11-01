#!/usr/bin/env node
// Checks i18n parity: every locale must have the same keys as en,
// with no extras or missing keys.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'i18n.js'), 'utf8');

const stubDoc = {
  documentElement: { lang: 'en', setAttribute() {}, getAttribute: () => null, setAttribute() {} },
  addEventListener: () => {}, querySelectorAll: () => []
};
const stubStorage = { getItem: () => null, setItem: () => {} };
const sandbox = {
  window: {
    document: stubDoc, localStorage: stubStorage,
    navigator: { language: 'en', userLanguage: 'en' }, console
  },
  document: stubDoc, localStorage: stubStorage, navigator: { language: 'en', userLanguage: 'en' }, console
};
sandbox.globalThis = sandbox;

try {
  vm.runInNewContext(code, sandbox);
} catch (e) {
  console.error('Could not load i18n.js:', e.message);
  process.exit(2);
}

const locales = sandbox.BUSHO_I18N || (sandbox.window && sandbox.window.BUSHO_I18N);
if (!locales || !locales.en) {
  console.error('window.BUSHO_I18N.en not found');
  process.exit(2);
}

// Read locale dictionaries directly from the vm-loaded BUSHO_I18N
const localeNames = ['en', 'hi', 'ta', 'te', 'bn', 'mr'];
const localeDicts = {};

// The user wants window.BUSHO_I18N to contain the dictionaries directly.
// Our i18n.js sets: exposed.locales = locales, so locales contain en/hi/etc.
for (const lang of localeNames) {
  if (locales.locales && locales.locales[lang]) localeDicts[lang] = locales.locales[lang];
  else if (locales[lang] && typeof locales[lang] === 'object' && !('t' in locales[lang])) localeDicts[lang] = locales[lang];
  else if (locales[lang] && typeof locales[lang] === 'object') localeDicts[lang] = locales[lang];
}

if (!localeDicts.en) {
  console.error('English locale dictionary not found');
  process.exit(2);
}

const enKeys = new Set(Object.keys(localeDicts.en));

let failures = 0;
for (const lang of localeNames) {
  if (lang === 'en') continue;
  if (!localeDicts[lang]) {
    console.error(`${lang}: MISSING locale dictionary`);
    failures += 1;
    continue;
  }
  const langKeys = new Set(Object.keys(localeDicts[lang]));
  const missing = [...enKeys].filter(k => !langKeys.has(k));
  const extra = [...langKeys].filter(k => !enKeys.has(k));
  if (missing.length) {
    console.error(`${lang}: missing ${missing.length} key(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ' ...' : ''}`);
    failures += 1;
  }
  if (extra.length) {
    console.error(`${lang}: extra ${extra.length} key(s): ${extra.slice(0, 5).join(', ')}${extra.length > 5 ? ' ...' : ''}`);
    failures += 1;
  }
}

if (failures === 0) {
  console.log('All locales match English key set.');
} else {
  console.error(`\n${failures} locale issue(s) found.`);
  process.exit(1);
}
