const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const operations = require('../supervisor-operations.js');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function makeDocument() {
  const modules = new Map(
    ['overview','reports','activity','facilities','workers','trends','inventory','approvals'].map(name => [
      name, { innerHTML: '' }
    ])
  );
  const selectors = new Map();
  return {
    modules,
    querySelector(selector) {
      const match = selector.match(/^\[data-module="([^"]+)"\]$/);
      if (match) return modules.get(match[1]) || null;
      return selectors.get(selector) || null;
    },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    addEventListener() {},
    removeEventListener() {}
  };
}

test('supervisor portal loads the live controller after auth and database client setup', () => {
  const html = read('supervisor.html');
  const scripts = [
    'supabase-client.js',
    'role-auth.js',
    'portal-enhancements.js',
    'portal-redesign.js',
    'supervisor-operations.js',
    'supervisor-portal.js'
  ].map(file => html.indexOf(file));
  assert.ok(scripts.every(index => index >= 0));
  assert.deepEqual(scripts, scripts.slice().sort((a,b) => a-b));
  const mount = read('supervisor-portal.js');
  assert.match(mount, /busho:authenticated/);
  assert.match(mount, /busho:unauthenticated/);
  assert.match(mount, /createController/);
});

test('supervisor controller renders truthful empty states from an empty scoped query', async () => {
  const doc = makeDocument();
  const controller = operations.createController({
    client: { async listSupervisorReports() { return []; } },
    document: doc,
    role: 'supervisor'
  });
  await controller.load();
  assert.match(doc.modules.get('overview').innerHTML, /0/);
  assert.match(doc.modules.get('reports').innerHTML, /No records match this filter/);
  assert.match(doc.modules.get('activity').innerHTML, /No workflow events/);
  assert.match(doc.modules.get('facilities').innerHTML, /No facility activity/);
  assert.match(doc.modules.get('workers').innerHTML, /No worker activity/);
  assert.match(doc.modules.get('inventory').innerHTML, /not yet connected/);
  assert.equal(controller.getState().error, '');
});

test('supervisor controller renders scoped records and review controls without hard-coded demo metrics', async () => {
  const doc = makeDocument();
  const controller = operations.createController({
    client: {
      async listSupervisorReports() {
        return [{
          id: 'report-1',
          facility_id: 'facility-1',
          worker_id: 'worker-1',
          status: 'submitted',
          original_text: 'Four people reported fever',
          reporting_date: '2026-11-07',
          submitted_at: '2026-11-07T08:00:00Z',
          created_at: '2026-11-07T07:55:00Z',
          language_code: 'hi',
          workers: { display_name: 'Worker A' },
          facilities: { name: 'Facility A', district: 'Balod' },
          report_items: [{
            id: 'item-1',
            item_type: 'symptom_trend',
            display_label: 'Fever',
            quantity: 4,
            unit: 'patients',
            value_text: JSON.stringify({ source_phrase: '4 people reported fever' }),
            requires_review: true
          }],
          report_events: [{ id: 'event-1', action: 'report_submitted', actor_role: 'worker', created_at: '2026-11-07T08:00:00Z' }]
        }];
      }
    },
    document: doc,
    role: 'supervisor'
  });
  await controller.load();
  assert.match(doc.modules.get('overview').innerHTML, /Facility A/);
  assert.match(doc.modules.get('reports').innerHTML, /Worker A/);
  assert.match(doc.modules.get('reports').innerHTML, /Awaiting review/);
  assert.match(doc.modules.get('reports').innerHTML, /data-open-report="report-1"/);
  assert.equal(controller.getState().reports.length, 1);
  controller.selectReport('report-1');
  assert.match(doc.modules.get('reports').innerHTML, /data-review-form/);
  assert.match(doc.modules.get('reports').innerHTML, /supervisor_verified/);
});

test('non-supervisor scoped administrators see reports but receive no review controls', async () => {
  const doc = makeDocument();
  const controller = operations.createController({
    client: {
      async listSupervisorReports() {
        return [{
          id: 'report-1', facility_id: 'facility-1', worker_id: 'worker-1',
          status: 'submitted', original_text: 'Aggregate report', created_at: '2026-11-07T07:00:00Z',
          workers: { display_name: 'Worker A' }, facilities: { name: 'Facility A' },
          report_items: [], report_events: []
        }];
      }
    },
    document: doc,
    role: 'district_admin'
  });
  await controller.load();
  assert.equal(controller.getState().reports.length, 1);
  controller.selectReport('report-1');
  assert.doesNotMatch(doc.modules.get('reports').innerHTML, /data-review-form/);
});

test('supervisor page no longer activates synthetic browser-local supervisor notifications', () => {
  const enhancements = read('portal-enhancements.js');
  assert.match(enhancements, /if \(role === 'supervisor'\) return/);
  const html = read('supervisor.html');
  assert.doesNotMatch(html, /Fever mentions · Rampur HWC|Demo Worker A|Reports received this week/);
});

test('supervisor page does not load the legacy worker/demo state machine', () => {
  const html = read('supervisor.html');
  assert.doesNotMatch(html, /<script[^>]+app-v2\.js/);
  assert.match(html, /supervisor-operations\.js/);
  assert.match(html, /supervisor-portal\.js/);
  assert.match(html, /data-module="overview"/);
});


test('authenticated supervisor portal contains no legacy worker panel or fabricated facility, trend and stock metrics', () => {
  const html = read('supervisor.html');
  assert.doesNotMatch(html, /data-module="overview-content"|id="worker-panel"|id="supervisor-panel"/);
  assert.doesNotMatch(html, /Rampur HWC|Rampur block|Fever mentions at|\+38%|20 \/ 50|14 \/ 60|72 \/ 100|48h/);
  assert.match(html, /Resolved from your authenticated account/);
  assert.match(html, /data-module="overview"/);
  assert.match(html, /supervisor-operations\.js/);
});
