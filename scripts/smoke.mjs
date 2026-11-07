#!/usr/bin/env node
// Dependency-free integrity check for the BUSHO static demo.
// Starts the local server, then verifies the pages load, local assets resolve,
// JavaScript parses, basic accessibility hygiene holds, and private files are not served.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = 4200 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${port}`;

// Edit this list if event or product naming changes.
const bannedStrings = ['Code for Communities', 'lorem ipsum', 'TODO:'];
// Paths that must never be served by the local demo server.
const mustBeHidden = ['/.git/config', '/server.mjs', '/package.json', '/tests/extraction.test.cjs', '/README.md'];
const existingNonPublicFiles = ['/tests/extraction.test.cjs'];
const hiddenPaths = ['/.hidden', '/.git', '/.env', '/tests'];
const disallowedExtensions = ['/package-lock.json'];
const traversalPaths = [
  '/%2e%2e/%2e%2e/etc/passwd',
  '/%2e%2e/server.mjs',
  '/%5c..%5cserver.mjs',
  '/..%5cserver.mjs'
];

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

function waitForExit(child, timeout = 1500) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(false), timeout);
    child.once('exit', () => finish(true));
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill();
  if (await waitForExit(child)) return;
  child.kill('SIGKILL');
  await waitForExit(child, 1000);
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

async function checkOutsideSymlink() {
  const linkPath = join(root, `busho-smoke-link-${process.pid}-${Date.now()}.js`);
  const outsideDir = await mkdtemp(join(tmpdir(), 'busho-smoke-outside-'));
  const outsideFile = join(outsideDir, 'outside.js');
  try {
    await writeFile(outsideFile, 'outside smoke fixture');
    await symlink(outsideFile, linkPath, 'file');
    const result = await rawGet(`/${basename(linkPath)}`);
    check(result.status === 404, 'symlink outside public root is blocked');
  } catch (error) {
    if (['EACCES', 'EPERM', 'ENOTSUP'].includes(error.code)) {
      console.log(`  SKIP  symlink outside public root (platform denied symlink creation: ${error.code})`);
    } else {
      bad(`symlink outside public root test errored: ${error.message}`);
    }
  } finally {
    await unlink(linkPath).catch(() => {});
    await rm(outsideDir, { recursive: true, force: true });
  }
}

async function checkPrivateDirectoryFile() {
  const fixturePath = join(root, 'scripts', `busho-smoke-private-${process.pid}-${Date.now()}.js`);
  try {
    await writeFile(fixturePath, 'private smoke fixture');
    check(existsSync(fixturePath), '/scripts fixture exists with an allowed extension');
    const result = await rawGet(`/${fixturePath.slice(root.length + 1).replaceAll('\\', '/')}`);
    check(result.status === 404, 'existing allowed-extension file in /scripts is blocked');
  } catch (error) {
    bad(`private-directory fixture test errored: ${error.message}`);
  } finally {
    await unlink(fixturePath).catch(() => {});
  }
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

  console.log('\n[role portals]');
  const workerPage = await rawGet('/worker.html');
  const supervisorPage = await rawGet('/supervisor.html');
  const adminPage = await rawGet('/admin.html');
  check(workerPage.status === 200 && workerPage.body.includes('data-portal-role=\"worker\"'), 'health worker portal route is served with worker role');
  check(supervisorPage.status === 200 && supervisorPage.body.includes('data-portal-role=\"supervisor\"'), 'supervisor portal route is served with supervisor role');
  check(!workerPage.body.includes('@busho.demo') && workerPage.body.includes('your registered email'), 'worker portal does not expose synthetic login credentials');
  check(!supervisorPage.body.includes('@busho.demo') && supervisorPage.body.includes('Authenticated BUSHO account'), 'supervisor portal does not expose synthetic login credentials');
  check(!index.body.includes('id=\"worker-panel\"') && !index.body.includes('id=\"supervisor-panel\"'), 'public landing page does not embed either private workspace');
  check(workerPage.body.includes('class="portal-sidebar worker-sidebar"') && workerPage.body.includes('data-portal-view="new-report"'), 'worker portal has its own field-work navigation');
  check(supervisorPage.body.includes('class="portal-sidebar supervisor-sidebar"') && supervisorPage.body.includes('data-portal-view="reports"') && supervisorPage.body.includes('data-portal-view="approvals"'), 'supervisor portal has dedicated reports and approvals navigation');
  check(workerPage.body.includes('data-module="my-reports"') && supervisorPage.body.includes('data-module="reports"'), 'worker report history and supervisor reports inbox are separate modules');
  check(workerPage.body.includes('id="message-text"') && supervisorPage.body.includes('id="message-text"'), 'report input has the live status node required by the extraction workflow');
  check(workerPage.body.includes('id="profile-trigger"') && supervisorPage.body.includes('id="profile-trigger"'), 'both role portals expose an accessible profile menu');
  check(supervisorPage.body.includes('data-module="overview"') && supervisorPage.body.includes('supervisor-operations.js'), 'supervisor overview mounts the authenticated live operations workspace');

  console.log('\n[assets]');
  const pages = [index.body, workerPage.body, supervisorPage.body, adminPage.body];
  const allPageBodies = [index.body, workerPage.body, supervisorPage.body, adminPage.body];
  const allRefs = [...new Set(allPageBodies.flatMap(localRefs))];
  for (const ref of allRefs) {
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
  for (const p of existingNonPublicFiles) {
    check(existsSync(join(root, p.slice(1))), `${p} exists as a non-public fixture`);
    const r = await rawGet(p);
    check(r.status === 404, `${p} existing non-public file -> ${r.status}`);
  }
  await checkPrivateDirectoryFile();
  console.log('\n[server hardening]');
  for (const p of hiddenPaths) {
    const r = await rawGet(p);
    check(r.status === 404, `${p} hidden -> ${r.status}`);
  }
  for (const p of disallowedExtensions) {
    const r = await rawGet(p);
    check(r.status === 404, `${p} disallowed extension -> ${r.status}`);
  }
  const malformed = await rawGet('/%E0%A4%A');
  check(malformed.status === 404, `malformed percent-encoding -> ${malformed.status}`);
  for (const p of traversalPaths) {
    const r = await rawGet(p);
    check(r.status === 404, `${p} traversal blocked -> ${r.status}`);
  }
  await checkOutsideSymlink();

  const i18n = join(root, 'scripts', 'check-i18n.mjs');
  if (existsSync(i18n)) {
    console.log('\n[i18n parity]');
    const r = spawnSync(process.execPath, [i18n], { cwd: root, encoding: 'utf8' });
    check(r.status === 0, 'scripts/check-i18n.mjs passes' + (r.status ? `\n${r.stdout}${r.stderr}` : ''));
  }
} catch (e) {
  if (e.message !== 'server') bad(`unexpected error: ${e.message}`);
} finally {
  await stopServer(server);
}

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll smoke checks passed.');
process.exit(failures ? 1 : 0);
