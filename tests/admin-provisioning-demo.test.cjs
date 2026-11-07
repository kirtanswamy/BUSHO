'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'admin-portal.js'), 'utf8');

function element(id, tagName = 'div') {
  const listeners = new Map();
  const children = [];
  const classes = new Set();
  return {
    id, tagName, value: '', textContent: '', className: '', checked: false,
    required: false, disabled: false, options: children, children,
    listeners,
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      toggle(name, force) {
        const enabled = force === undefined ? !classes.has(name) : Boolean(force);
        if (enabled) classes.add(name); else classes.delete(name);
        return enabled;
      },
      contains(name) { return classes.has(name); }
    },
    addEventListener(type, fn) {
      const list = listeners.get(type) || [];
      list.push(fn);
      listeners.set(type, list);
    },
    async emit(type, event = {}) {
      for (const fn of listeners.get(type) || []) await fn({ preventDefault() {}, target: this, ...event });
    },
    append(...items) {
      children.push(...items);
      if (tagName === 'select' && !this.value && items.length) this.value = items[0].value || '';
    },
    replaceChildren(...items) {
      children.splice(0, children.length, ...items);
      if (tagName === 'select') this.value = items[0]?.value || '';
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    reset() { this.wasReset = true; }
  };
}

function harness() {
  const ids = [
    'provision-role','facility-section','facility-options','facility-help',
    'district-section','provision-district','consent-section','provision-consent',
    'provision-form','provision-submit','provision-status','facility-readiness',
    'facility-readiness-detail','admin-role-chip','provision-email','provision-name',
    'provision-language'
  ];
  const elements = new Map(ids.map(id => [id, element(id,
    ['provision-role','provision-district','provision-language'].includes(id) ? 'select' :
    id === 'provision-form' ? 'form' : 'div'
  )]));
  elements.get('provision-language').value = 'hi';
  const page = element('admin-root');
  page.dataset = { portalRole: 'admin' };
  const events = new Map();
  const document = {
    querySelector(selector) { return selector === '[data-portal-role="admin"]' ? page : null; },
    getElementById(id) { return elements.get(id) || null; },
    createElement(tag) { return element('', tag); },
    addEventListener(type, fn) {
      const list = events.get(type) || [];
      list.push(fn);
      events.set(type, list);
    },
    async dispatchEvent(event) {
      for (const fn of events.get(event.type) || []) await fn(event);
      return true;
    }
  };
  const calls = { listOptions: 0, provision: [] };
  const sandbox = {
    document,
    CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    window: {
      BUSHO_SUPABASE_CONFIG: { url: 'https://example.invalid', publishableKey: 'sb_publishable_test' },
      BUSHO_SUPABASE_CLIENT: {
        createClient() {
          return {
            async listProvisioningOptions() {
              calls.listOptions += 1;
              return { facilities: [], districts: [] };
            },
            async provisionUser(input) {
              calls.provision.push(input);
              return { invitation: { email: input.email } };
            }
          };
        }
      }
    }
  };
  vm.runInNewContext(source, sandbox, { filename: 'admin-portal.js' });
  return { elements, calls, document };
}

test('admin provisioning UI blocks facility-based invitations when verified facilities are absent', async () => {
  const app = harness();
  await app.document.dispatchEvent({ type: 'busho:authenticated',
    detail: { profile: { id: 'synthetic-admin', role: 'platform_admin', status: 'active', display_name: 'Synthetic Admin' } }
  });

  assert.equal(app.calls.listOptions, 1);
  assert.match(app.elements.get('facility-readiness').textContent, /0 verified facilities/i);
  assert.match(app.elements.get('facility-help').textContent, /No assignable facilities/i);
  const workerOption = app.elements.get('provision-role').children.find(option => option.value === 'worker');
  assert.equal(workerOption.disabled, true, 'worker role must be disabled without verified facilities');
  // Simulate a stale or manipulated form value to assert the submit handler
  // independently refuses the invitation even if the disabled option is forced.
  app.elements.get('provision-role').value = 'worker';

  await app.elements.get('provision-form').emit('submit');
  assert.equal(app.calls.provision.length, 0);
  assert.match(app.elements.get('provision-status').textContent, /No verified facility is available/i);
});

test('admin provisioning UI does not invent district options when directory is empty', async () => {
  const app = harness();
  await app.document.dispatchEvent({ type: 'busho:authenticated',
    detail: { profile: { id: 'synthetic-state-admin', role: 'state_admin', status: 'active' } }
  });

  const districtOptions = app.elements.get('provision-district').children;
  assert.equal(districtOptions.length, 1, 'only the empty placeholder should be rendered');
  assert.equal(districtOptions[0].value, '');
  for (const role of app.elements.get('provision-role').children) {
    assert.equal(role.disabled, true, 'no role requiring a missing facility or district may be selectable');
  }
});
