#!/usr/bin/env node
// Dependency-free integrity check for the BUSHO static demo.
// Starts the local server, then verifies the pages load, local assets resolve,
// JavaScript parses, basic accessibility hygiene holds, and private files are not served.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = 4200 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${port}`;

// Edit this list if event or product naming changes.
const bannedStrings = ['Code for Communities', 'lorem ipsum', 'TODO:'];
// Paths that must never be served by the local demo server.
const mustBeHidden = ['/.git/config', '/server.mjs', '/package.json', '/tests/extraction.test.cjs', '/README.md'];

let failures = 0;
const ok = msg => console.log(`  PASS  ${msg}`);
const bad = msg => { failures += 1; console.log(`  FAIL  ${msg}`); };
const check = (cond, msg) => (cond ? ok(msg) : bad(msg));

function rawGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method: 'GET' }, res => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'] || '', body }));
    });
    req.on('error', reject);
    req.setTimeout(4000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try { await rawGet('/'); return true; } catch { await new Promise(r => setTimeout(r, 150)); }
  }
  return false;
}

function localRefs(html) {
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  return [...new Set(refs)]
    .filter(r => !/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(r))
    .map(r => '/' + r.split('#')[0].split('?')[0].replace(/^\//, ''))
    .filter(r => r !== '/');
}

function auditHtml(name, html) {
  console.log(`\n[${name}]`);
  check(/<html[^>]*\slang="[a-z]{2}/i.test(html), 'html element has a lang attribute');
  check(/<title>[^<]{3,}<\/title>/i.test(html), 'page has a title');
  check(/<meta[^>]+name="viewport"/i.test(html), 'viewport meta present');
  check(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/i.test(html), 'zoom is not disabled');
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  check(h1 === 1, `exactly one <h1> (found ${h1})`);
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  check(imgs.every(t => /\salt=/.test(t)), `all ${imgs.length} <img> tags have alt text`);
  const inlineScripts = (html.match(/<script\b(?![^>]*\bsrc=)[^>]*>/gi) || []).length;
  check(inlineScripts === 0, `no inline <script> blocks (CSP-friendly), found ${inlineScripts}`);
  const inlineHandlers = (html.match(/\son[a-z]+\s*=\s*["']/gi) || []).length;
  check(inlineHandlers === 0, `no inline event-handler attributes, found ${inlineHandlers}`);
  for (const s of bannedStrings) check(!html.toLowerCase().includes(s.toLowerCase()), `no stale text "${s}"`);
}

let server;
try {
  server = spawn(process.execPath, [join(root, 'server.mjs')], {
    cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'ignore'
  });
  console.log(`BUSHO smoke test against ${base}`);
  if (!(await waitForServer())) { bad('server did not start (does server.mjs honour PORT?)'); throw new Error('server'); }

  const index = await rawGet('/');
  console.log('\n[server]');
  check(index.status === 200 && index.type.startsWith('text/html'), 'GET / returns 200 text/html');
  auditHtml('index.html', index.body);

  console.log('\n[assets]');
  const pages = [index.body];
  for (const ref of localRefs(index.body)) {
    const r = await rawGet(ref);
    check(r.status === 200, `${ref} resolves (${r.status})`);
    if (r.status === 200 && ref.endsWith('.js')) {
      try { new vm.Script(r.body, { filename: ref }); ok(`${ref} parses as valid JavaScript`); }
      catch (e) { bad(`${ref} has a syntax error: ${e.message}`); }
    }
    if (r.status === 200 && ref.endsWith('.html')) { pages.push(r.body); auditHtml(ref, r.body); }
  }

  console.log('\n[private files must not be served]');
  for (const p of mustBeHidden) {
    const r = await rawGet(p);
    check(r.status === 404, `${p} -> ${r.status}`);
  }
  const trav = await rawGet('/%2e%2e/%2e%2e/etc/passwd');
  check(trav.status === 404, `path traversal blocked -> ${trav.status}`);

  const i18n = join(root, 'scripts', 'check-i18n.mjs');
  if (existsSync(i18n)) {
    console.log('\n[i18n parity]');
    const r = spawnSync(process.execPath, [i18n], { cwd: root, encoding: 'utf8' });
    check(r.status === 0, 'scripts/check-i18n.mjs passes' + (r.status ? `\n${r.stdout}${r.stderr}` : ''));
  }
} catch (e) {
  if (e.message !== 'server') bad(`unexpected error: ${e.message}`);
} finally {
  if (server) server.kill();
}

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll smoke checks passed.');
process.exit(failures ? 1 : 0);
