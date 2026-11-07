'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const clientSource = read('supabase-client.js');
const policySource = read('portal-auth-policy.js');
const authSource = read('role-auth.js');

function makeElement(id, initial = {}) {
  const listeners = new Map();
  const classes = new Set(initial.classes || []);
  return {
    id,
    dataset: initial.dataset || {},
    value: initial.value || '',
    textContent: initial.textContent || '',
    disabled: false,
    attributes: {},
    listeners,
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); }
    },
    addEventListener(type, fn) {
      const list = listeners.get(type) || [];
      list.push(fn);
      listeners.set(type, list);
    },
    async emit(type, event = {}) {
      for (const fn of listeners.get(type) || []) await fn({
        preventDefault() {},
        target: this,
        ...event
      });
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    querySelector(selector) {
      if (selector === '[type="submit"]') return this.submitElement || null;
      return null;
    }
  };
}

function makePortal(portalRole, account) {
  const elements = new Map();
  const page = makeElement('portal-root', { dataset: { portalRole } });
  const login = makeElement('portal-login', { classes: [] });
  const app = makeElement('portal-app', { classes: ['hidden'] });
  const form = makeElement('portal-login-form');
  const email = makeElement('portal-username');
  const password = makeElement('portal-password');
  const error = makeElement('portal-login-error');
  const logout = makeElement('portal-logout');
  const session = makeElement('session-label');
  const submit = makeElement('submit', { textContent: 'Sign in' });
  form.submitElement = submit;
  const focusTarget = makeElement('demo-title');
  for (const el of [login, app, form, email, password, error, logout, session, focusTarget]) elements.set(el.id, el);

  const events = [];
  const document = {
    querySelector(selector) {
      if (selector === '[data-portal-role]') return page;
      if (selector === '.portal-session-bar span') return session;
      return null;
    },
    getElementById(id) { return elements.get(id) || null; },
    dispatchEvent(event) { events.push(event); return true; }
  };

  const storageMap = new Map();
  const storage = {
    getItem(key) { return storageMap.get(key) ?? null; },
    setItem(key, value) { storageMap.set(key, String(value)); },
    removeItem(key) { storageMap.delete(key); }
  };
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    if (String(url).includes('/auth/v1/token?grant_type=password')) {
      const body = JSON.parse(options.body);
      assert.equal(body.email, account.email);
      assert.equal(body.password, 'synthetic-demo-password');
      return response({
        access_token: 'synthetic-access-token',
        refresh_token: 'synthetic-refresh-token',
        expires_in: 3600,
        user: { id: account.id, email: account.email }
      });
    }
    if (String(url).includes('/rest/v1/profiles?')) return response([account.profile]);
    if (String(url).includes('/auth/v1/logout')) return response(null, 204);
    throw new Error('Unexpected network request: ' + url);
  };

  const sandbox = {
    document,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
    },
    URLSearchParams,
    console,
    setTimeout,
    clearTimeout
  };
  sandbox.window = sandbox;
  sandbox.BUSHO_SUPABASE_CONFIG = {
    url: 'https://synthetic-project.supabase.co',
    publishableKey: 'sb_publishable_synthetic_test_key',
    fetch,
    storage
  };
  sandbox.BUSHO_SUPABASE_CLIENT = undefined;

  vm.runInNewContext(clientSource, sandbox, { filename: 'supabase-client.js' });
  vm.runInNewContext(policySource, sandbox, { filename: 'portal-auth-policy.js' });
  vm.runInNewContext(authSource, sandbox, { filename: 'role-auth.js' });

  email.value = account.email;
  password.value = 'synthetic-demo-password';
  return {
    elements, events, calls, email, password, login, app, form, error, logout, session, submit,
    async signIn() { await form.emit('submit'); },
    async signOut() { await logout.emit('click'); }
  };
}

function response(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    async json() { return payload; },
    async text() { return ''; }
  };
}

const profiles = {
  worker: { id: 'synthetic-worker-auth-id', email: 'worker@busho.test', role: 'worker', status: 'active', display_name: 'Synthetic Worker' },
  supervisor: { id: 'synthetic-supervisor-auth-id', email: 'supervisor@busho.test', role: 'supervisor', status: 'active', display_name: 'Synthetic Supervisor' },
  storekeeper: { id: 'synthetic-storekeeper-auth-id', email: 'storekeeper@busho.test', role: 'storekeeper', status: 'active', display_name: 'Synthetic Storekeeper' }
};

for (const role of ['worker', 'supervisor', 'storekeeper']) {
  test(role + ' completes the actual Supabase-client and portal-auth sign-in path', async () => {
    const profile = profiles[role];
    const app = makePortal(role, { id: profile.id, email: profile.email, profile });
    await app.signIn();

    assert.equal(app.login.classList.contains('hidden'), true);
    assert.equal(app.app.classList.contains('hidden'), false);
    assert.equal(app.app.getAttribute('aria-hidden'), 'false');
    assert.equal(app.password.value, '');
    assert.match(app.session.textContent, new RegExp('Synthetic ' + role[0].toUpperCase() + role.slice(1)));
    assert.deepEqual(app.events.map(event => event.type), ['busho:authenticated']);
    assert.equal(app.events[0].detail.profile.role, role);
    assert.ok(app.calls.some(call => call.url.includes('/auth/v1/token?grant_type=password')));
    assert.ok(app.calls.some(call => call.url.includes('/rest/v1/profiles?')));

    await app.signOut();
    assert.equal(app.login.classList.contains('hidden'), false);
    assert.equal(app.app.classList.contains('hidden'), true);
    assert.equal(app.app.getAttribute('aria-hidden'), 'true');
    assert.deepEqual(app.events.map(event => event.type), ['busho:authenticated', 'busho:unauthenticated']);
    assert.ok(app.calls.some(call => call.url.includes('/auth/v1/logout')));
  });
}

test('a valid account with the wrong portal role is signed out and denied', async () => {
  const profile = profiles.supervisor;
  const app = makePortal('worker', { id: profile.id, email: profile.email, profile });
  await app.signIn();

  assert.equal(app.login.classList.contains('hidden'), false);
  assert.equal(app.app.classList.contains('hidden'), true);
  assert.match(app.error.textContent, /not assigned the Health Worker role/i);
  assert.deepEqual(app.events.map(event => event.type), ['busho:unauthenticated']);
  assert.ok(app.calls.some(call => call.url.includes('/auth/v1/logout')));
});

test('pending accounts are denied even when the role matches the portal', async () => {
  const profile = { ...profiles.worker, status: 'pending' };
  const app = makePortal('worker', { id: profile.id, email: profile.email, profile });
  await app.signIn();

  assert.equal(app.login.classList.contains('hidden'), false);
  assert.equal(app.app.classList.contains('hidden'), true);
  assert.match(app.error.textContent, /awaiting administrator approval/i);
  assert.deepEqual(app.events.map(event => event.type), ['busho:unauthenticated']);
});

test('missing profiles are denied and do not enter the portal', async () => {
  const profile = profiles.worker;
  const app = makePortal('worker', { id: profile.id, email: profile.email, profile: null });
  await app.signIn();

  assert.equal(app.login.classList.contains('hidden'), false);
  assert.equal(app.app.classList.contains('hidden'), true);
  assert.match(app.error.textContent, /not linked to a BUSHO profile/i);
});
