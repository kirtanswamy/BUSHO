'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

const fixtures = {
  storekeeper: {
    initial: [{
      id: 'request-1',
      status: 'submitted_to_dpdmis',
      requested_quantity: 10,
      received_quantity: 0,
      unit: 'packs',
      inventory_items: { name: 'ORS', unit: 'packs' },
      facilities: { name: 'Synthetic Facility' },
      inventory_movements: [],
      replenishment_events: []
    }],
    updated: [{
      id: 'request-1',
      status: 'allocated',
      requested_quantity: 10,
      received_quantity: 0,
      unit: 'packs',
      inventory_items: { name: 'ORS', unit: 'packs' },
      facilities: { name: 'Synthetic Facility' },
      inventory_movements: [],
      replenishment_events: []
    }],
    action: 'allocate',
    nextAction: 'dispatch',
    listId: 'storekeeper-requests',
    messageId: 'storekeeper-message',
    refreshId: 'storekeeper-refresh',
    script: 'storekeeper-portal.js',
    formClass: 'storekeeper-action',
    rowSelector: '[data-request]',
    rowAttribute: 'request'
  },
  supervisor: {
    initial: [{
      id: 'request-1',
      status: 'recommended_to_facility_store',
      requested_quantity: 10,
      received_quantity: 0,
      unit: 'packs',
      inventory_items: { name: 'ORS', unit: 'packs' },
      facilities: { name: 'Synthetic Facility' }
    }],
    updated: [{
      id: 'request-1',
      status: 'supervisor_approved',
      requested_quantity: 10,
      received_quantity: 0,
      unit: 'packs',
      inventory_items: { name: 'ORS', unit: 'packs' },
      facilities: { name: 'Synthetic Facility' }
    }],
    action: 'approve',
    nextAction: 'submit',
    listId: 'supply-handoff-list',
    messageId: 'supply-handoff-message',
    refreshId: 'supply-handoff-refresh',
    script: 'supervisor-supply-handoff.js',
    formClass: 'handoff-action',
    rowSelector: '[data-handoff-id]',
    rowAttribute: 'handoffId'
  }
};

function makeHarness(role, listResponses, transitionError = null) {
  const config = fixtures[role];
  const listeners = new Map();
  const elements = new Map();

  for (const id of [
    config.listId,
    config.messageId,
    config.refreshId,
    role === 'storekeeper' ? 'storekeeper-summary' : 'supply-handoff-summary',
    'storekeeper-name'
  ]) {
    elements.set(id, {
      id,
      innerHTML: '',
      textContent: '',
      addEventListener(name, callback) {
        listeners.set(id + ':' + name, callback);
      }
    });
  }

  const page = {};
  const document = {
    querySelector(selector) {
      return selector === '[data-portal-role="' + role + '"]' ? page : null;
    },
    getElementById(id) {
      return elements.get(id) || null;
    },
    addEventListener(name, callback) {
      listeners.set('document:' + name, callback);
    }
  };

  const client = {
    async listMyReplenishments() {
      if (!listResponses.length) {
        throw new Error('Unexpected extra list request in test');
      }
      const response = listResponses.shift();
      if (response instanceof Error) throw response;
      return response;
    },
    transitionCalls: 0,
    async transitionReplenishmentRequest(input) {
      client.transitionCalls += 1;
      client.lastTransition = input;
      if (transitionError) throw transitionError;
      return { id: input.id };
    },
    lastTransition: null
  };

  class MockFormData {
    constructor(form) {
      this.form = form;
    }
    get(name) {
      return this.form.values?.[name] ?? '';
    }
  }

  const context = {
    document,
    window: {
      BUSHO_SUPABASE_CONFIG: {},
      BUSHO_SUPABASE_CLIENT: {
        createClient() {
          return client;
        }
      }
    },
    FormData: MockFormData,
    console,
    Date,
    Number,
    String,
    Math,
    Array,
    Object,
    JSON
  };

  const source = fs.readFileSync(path.join(root, config.script), 'utf8');
  vm.runInNewContext(source, context, { filename: config.script });

  function authenticate() {
    listeners.get('document:busho:authenticated')({
      detail: {
        profile: {
          id: 'synthetic-user-1',
          role,
          display_name: 'Synthetic Test User'
        }
      }
    });
  }

  function makeForm(action = config.action) {
    const card = {
      dataset: { [config.rowAttribute]: 'request-1' }
    };
    return {
      dataset: { action },
      values: {
        reference: 'SYNTHETIC-REF-001',
        note: 'Synthetic test approval'
      },
      closest(selector) {
        return selector === config.rowSelector ? card : null;
      }
    };
  }

  async function submit(form = makeForm()) {
    const handler = listeners.get(config.listId + ':submit');
    assert.ok(handler, 'portal submit handler should be registered');
    let prevented = false;
    handler({
      target: {
        closest(selector) {
          return selector === 'form.' + config.formClass ? form : null;
        }
      },
      preventDefault() {
        prevented = true;
      }
    });
    assert.equal(prevented, true);
    await new Promise(resolve => setImmediate(resolve));
  }

  async function refresh() {
    const handler = listeners.get(config.refreshId + ':click');
    assert.ok(handler, 'portal refresh handler should be registered');
    handler();
    await new Promise(resolve => setImmediate(resolve));
  }

  return {
    client,
    elements,
    authenticate,
    makeForm,
    submit,
    refresh,
    config
  };
}

for (const role of ['storekeeper', 'supervisor']) {
  const config = fixtures[role];

  test(role + ': failed transition blocks another action until a successful refresh', async () => {
    const harness = makeHarness(
      role,
      [config.initial, config.initial],
      new Error('Synthetic transition failure')
    );

    harness.authenticate();
    await new Promise(resolve => setImmediate(resolve));

    assert.match(
      harness.elements.get(config.listId).innerHTML,
      new RegExp('data-action="' + config.action + '"')
    );

    await harness.submit();

    assert.match(
      harness.elements.get(config.messageId).innerHTML,
      /Synthetic transition failure/
    );
    assert.doesNotMatch(
      harness.elements.get(config.listId).innerHTML,
      /<form/
    );

    await harness.submit();
    assert.equal(harness.client.transitionCalls, 1,
      'a second transition must not be sent before refresh');

    await harness.refresh();

    assert.match(
      harness.elements.get(config.listId).innerHTML,
      new RegExp('data-action="' + config.action + '"')
    );
    assert.doesNotMatch(
      harness.elements.get(config.messageId).innerHTML,
      /Synthetic transition failure/
    );
  });

  test(role + ': successful write with failed list refresh preserves success and blocks stale actions', async () => {
    const harness = makeHarness(role, [
      config.initial,
      new Error('Synthetic refresh failure')
    ]);

    harness.authenticate();
    await new Promise(resolve => setImmediate(resolve));
    await harness.submit();

    const message = harness.elements.get(config.messageId).innerHTML;

    assert.match(message, /saved/i);
    assert.match(message, /could not be refreshed|could not be refreshed/i);
    assert.match(message, /role="status"/);
    assert.match(message, /role="alert"/);
    assert.doesNotMatch(
      harness.elements.get(config.listId).innerHTML,
      /<form/
    );
  });

  test(role + ': manual refresh restores actions using the latest server state', async () => {
    const harness = makeHarness(role, [
      config.initial,
      new Error('Synthetic refresh failure'),
      config.updated
    ]);

    harness.authenticate();
    await new Promise(resolve => setImmediate(resolve));
    await harness.submit();

    assert.doesNotMatch(
      harness.elements.get(config.listId).innerHTML,
      /<form/
    );

    await harness.refresh();

    assert.match(
      harness.elements.get(config.listId).innerHTML,
      new RegExp('data-action="' + config.nextAction + '"')
    );
    assert.doesNotMatch(
      harness.elements.get(config.messageId).innerHTML,
      /could not be refreshed/
    );
  });
}
