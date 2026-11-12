'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'storekeeper-inventory-reconciliation.js'), 'utf8');

function harness(listInventory = async () => []) {
  const listeners = new Map();
  const elements = new Map();
  const makeElement = id => ({
    id,
    innerHTML: '',
    textContent: '',
    handlers: {},
    addEventListener(type, fn) { this.handlers[type] = fn; }
  });
  // Model the server-rendered empty state already present in storekeeper.html.
  elements.set('inventory-reconciliation-list', Object.assign(makeElement('inventory-reconciliation-list'), {
    innerHTML: '<p class="empty-state">Sign in to load inventory evidence.</p>'
  }));
  const document = {
    querySelector(selector) { return selector === '[data-portal-role="storekeeper"]' ? {} : null; },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    addEventListener(type, fn) {
      const entries = listeners.get(type) || [];
      entries.push(fn);
      listeners.set(type, entries);
    }
  };
  let createClientCalls = 0;
  const sandbox = {
    document,
    Date,
    Number,
    String,
    Array,
    window: {
      BUSHO_SUPABASE_CONFIG: { url: 'https://example.invalid', key: 'test-key' },
      BUSHO_SUPABASE_CLIENT: {
        createClient() {
          createClientCalls += 1;
          return { listInventory };
        }
      }
    }
  };
  vm.runInNewContext(source, sandbox, { filename: 'storekeeper-inventory-reconciliation.js' });
  return {
    elements,
    listeners,
    get createClientCalls() { return createClientCalls; },
    dispatch(type, detail) {
      for (const fn of listeners.get(type) || []) fn({ detail });
    },
    async settle() {
      await new Promise(resolve => setImmediate(resolve));
      await Promise.resolve();
    }
  };
}

test('storekeeper inventory view loads scoped evidence and never invents a balance', async () => {
  const app = harness(async () => [{
    item_code: 'ORS-01',
    name: '<script>alert(1)</script> ORS',
    unit: 'sachets',
    inventory_snapshots: [{
      quantity: 12,
      observed_at: new Date().toISOString(),
      source: 'storekeeper_count',
      data_mode: 'synthetic_demo',
      batch_number: 'B-01'
    }],
    inventory_movements: [{
      quantity_delta: 5,
      unit: 'sachets',
      external_reference: 'GRN-SYNTH-01',
      created_at: new Date().toISOString(),
      data_mode: 'synthetic_demo'
    }]
  }]);
  app.dispatch('busho:authenticated', { profile: { id: 'storekeeper-1', role: 'storekeeper' } });
  await app.settle();

  const html = app.elements.get('inventory-reconciliation-list').innerHTML;
  assert.equal(app.createClientCalls, 1);
  assert.match(html, /Latest observation/);
  assert.match(html, /12 sachets/);
  assert.match(html, /Recorded inbound receipts/);
  assert.match(html, /5 sachets/);
  assert.match(html, /GRN-SYNTH-01/);
  assert.match(html, /Synthetic evidence/);
  assert.match(html, /Calculated balance: not available/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&lt;script&gt;/);

  app.dispatch('busho:unauthenticated');
  assert.match(app.elements.get('inventory-reconciliation-list').innerHTML, /No active inventory items/);
});

test('non-storekeeper authentication does not initialise inventory access', async () => {
  const app = harness();
  app.dispatch('busho:authenticated', { profile: { id: 'worker-1', role: 'worker' } });
  await app.settle();
  assert.equal(app.createClientCalls, 0);
  assert.match(app.elements.get('inventory-reconciliation-list').innerHTML, /Sign in to load inventory evidence/);
});

test('invalid observation timestamp is labelled unknown, not stale', async () => {
  const app = harness(async () => [{
    item_code: 'TEST-01',
    name: 'Test item',
    unit: 'units',
    inventory_snapshots: [{ quantity: 2, observed_at: 'not-a-date', source: 'manual' }],
    inventory_movements: []
  }]);
  app.dispatch('busho:authenticated', { profile: { id: 'storekeeper-1', role: 'storekeeper' } });
  await app.settle();
  assert.match(app.elements.get('storekeeper-inventory-reconciliation' )?.innerHTML || app.elements.get('inventory-reconciliation-list').innerHTML, /Observation freshness/);
  assert.match(app.elements.get('inventory-reconciliation-list').innerHTML, /Unknown/);
  assert.doesNotMatch(app.elements.get('inventory-reconciliation-list').innerHTML, /Older than 7 days/);
});

test('inventory read failures are surfaced without displaying stale rows', async () => {
  const app = harness(async () => { throw new Error('permission denied'); });
  app.dispatch('busho:authenticated', { profile: { id: 'storekeeper-1', role: 'storekeeper' } });
  await app.settle();
  assert.match(app.elements.get('inventory-reconciliation-message').innerHTML, /permission denied/);
  assert.match(app.elements.get('inventory-reconciliation-list').innerHTML, /could not be loaded/);
});
