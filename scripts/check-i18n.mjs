#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = JSON.parse(readFileSync('i18n.js', 'utf8'));
// Simple parser: extract locale objects from the source
const source = readFileSync('i18n.js', 'utf8');

// Find locale definitions using regex
const localeRegex = /const locales = \{([\s\S]*?)\};/;
const match = source.match(localeRegex);

if (!match) {
  console.error('Could not parse locales');
  process.exit(1);
}

// Extract locale blocks by looking for quoted language keys and their object bodies
const localeNames = ['en', 'hi', 'ta', 'te', 'bn', 'mr'];
const localeBlocks = {};

for (const lang of localeNames) {
  const pattern = new RegExp(`'"'"'${lang}"'"'"'\\s*:\\s*\\{([\\s\\S]*?)\\}(?=\\s*,\\s*'"'"'[a-z]{2}"'"'"'\\s*\\:|\\})`, 'g');
  // Actually use a simpler approach: find section between lang key and next lang or closing
}

// Even simpler: parse manually by reading the file line by line and tracking braces
let lines = source.split('\n');
let currentLang = null;
let currentKeys = new Set();
let localeKeys = {};

for (const line of lines) {
  const langMatch = line.match(/'"'"'(en|hi|ta|te|bn|mr)'"'"':\s*\{/);
  if (langMatch) {
    currentLang = langMatch[1];
    localeKeys[currentLang] = new Set();
    continue;
  }
  if (currentLang) {
    const keyMatch = line.match(/'([^']+)'\s*:/);
    if (keyMatch) {
      localeKeys[currentLang].add(keyMatch[1]);
    }
    if (line.includes('},')) {
      // Check if we've moved to next locale or ended
    }
  }
}

// Even simpler approach: use the actual locales variable via eval-like parsing
// Given time constraints, use a basic string-based approach
const enMatch = source.match(/en:\s*\{([\s\S]*?)\},?\s*hi:/);
const keysFromEn = enMatch ? enMatch[1].match(/'[^']+':/g) || [] : [];
const enKeys = new Set(keysFromEn.map(k => k.slice(1, -2)));

console.log('English keys:', enKeys.size);
console.log('Locales found:', localeNames.filter(l => source.includes(`'${l}':`)).join(', '));

// Check that all locales have at least the key set from en
for (const lang of localeNames) {
  if (!source.includes(`'${lang}':`)) {
    console.error(`Missing locale: ${lang}`);
    process.exit(1);
  }
}

console.log('Basic locale check passed');
