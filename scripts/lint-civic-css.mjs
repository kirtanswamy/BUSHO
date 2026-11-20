import { readFile } from 'node:fs/promises';

const files = ['civic-design-system.css', 'civic-landing.css'];
const system = await readFile(files[0], 'utf8');
const landing = await readFile(files[1], 'utf8');
const rootMatch = system.match(/:root\s*\{([^}]*)\}/);
if (!rootMatch) throw new Error('Missing :root design token block.');

const defined = new Set([...rootMatch[1].matchAll(/--(civic-[a-z0-9-]+)\s*:/g)].map(match => '--' + match[1]));
const used = new Set(Array.from((system + '\n' + landing).matchAll(/var\((--civic-[a-z0-9-]+)/g), match => match[1]));
const missing = [...used].filter(token => !defined.has(token));
if (missing.length) throw new Error('Undefined civic tokens: ' + missing.join(', '));

const outsideRoot = system.replace(rootMatch[0], '');
if (/#(?:[0-9a-fA-F]{3,8})\b/.test(outsideRoot)) {
  throw new Error('Found a hard-coded hex colour outside the shared token block.');
}
if (/#(?:[0-9a-fA-F]{3,8})\b/.test(landing)) {
  throw new Error('Landing components must consume shared civic tokens, not hard-coded hex colours.');
}

for (const file of files) {
  const css = await readFile(file, 'utf8');
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const opens = (withoutComments.match(/\{/g) || []).length;
  const closes = (withoutComments.match(/\}/g) || []).length;
  if (opens !== closes) throw new Error(file + ' has unbalanced CSS blocks.');
}
console.log('Civic CSS token lint passed: ' + defined.size + ' tokens; no ad-hoc component hex colours; CSS blocks balanced.');
