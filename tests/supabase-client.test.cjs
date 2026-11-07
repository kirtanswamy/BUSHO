const test = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('../supabase-client.js');

function makeStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    has: key => values.has(key)
  };
}

function jsonResponse(value, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => value,
    text: async () => JSON.stringify(value)
  };
}

test('client requires the URL and a modern publishable key', () => {
  assert.throws(() => createClient({ url: 'https://example.supabase.co' }), /publishable key/i);
  assert.throws(() => createClient({ publishableKey: 'sb_publishable_demo' }), /URL/i);
  assert.throws(() => createClient({ url: 'https://example.supabase.co', publishableKey: 'eyJlegacyanon' }), /sb_publishable_/i);
});

test('password sign-in stores a user session and loads the server-controlled profile', async () => {
  const storage = makeStorage();
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/auth/v1/token?grant_type=password')) {
      return jsonResponse({
        access_token: 'user-access-token',
        refresh_token: 'user-refresh-token',
        expires_in: 3600,
        user: { id: 'user-1', email: 'worker@example.test' }
      });
    }
    if (url.includes('/rest/v1/profiles?')) {
      return jsonResponse([{ id: 'user-1', role: 'worker', status: 'active' }]);
    }
    throw new Error('Unexpected request: ' + url);
  };
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch,
    storage,
    now: () => 1_800_000_000_000
  });
  const result = await client.signInWithPassword({ email: 'worker@example.test', password: 'demo-password' });
  assert.equal(result.user.id, 'user-1');
  assert.equal(result.profile.role, 'worker');
  assert.equal(result.canAccess, true);
  assert.equal(storage.has('busho-auth-session-v1'), true);
  assert.equal(calls[0].options.headers.apikey, 'sb_publishable_demo_key');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer user-access-token');
});

test('new auth users with pending profiles are not granted a BUSHO workspace', async () => {
  const storage = makeStorage();
  const fetch = async url => {
    if (url.includes('/auth/v1/token?grant_type=password')) {
      return jsonResponse({
        access_token: 'pending-token',
        refresh_token: 'pending-refresh',
        expires_in: 3600,
        user: { id: 'pending-1' }
      });
    }
    return jsonResponse([{ id: 'pending-1', role: 'pending', status: 'pending' }]);
  };
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch,
    storage,
    now: () => 1_800_000_000_000
  });
  const result = await client.signInWithPassword({ email: 'pending@example.test', password: 'demo-password' });
  assert.equal(result.canAccess, false);
  assert.equal(result.profile.role, 'pending');
});

test('REST requests use the signed-in user token and refresh an expired session', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'expired-access-token',
    refresh_token: 'refresh-token',
    expires_at: 1_799_999_999,
    user: { id: 'user-2' }
  }));
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/auth/v1/token?grant_type=refresh_token')) {
      return jsonResponse({
        access_token: 'refreshed-access-token',
        refresh_token: 'rotated-refresh-token',
        expires_in: 3600,
        user: { id: 'user-2' }
      });
    }
    if (url.includes('/rest/v1/reports?')) return jsonResponse([]);
    throw new Error('Unexpected request: ' + url);
  };
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch,
    storage,
    now: () => 1_800_000_000_000
  });
  await client.listMyReports();
  assert.ok(calls[0].url.includes('grant_type=refresh_token'));
  assert.equal(calls[1].options.headers.Authorization, 'Bearer refreshed-access-token');
  assert.equal(calls[1].options.headers.apikey, 'sb_publishable_demo_key');
});

test('worker report creation uses the worker profile and assigned facility, not caller-supplied worker identity', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'worker-token',
    refresh_token: 'worker-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'auth-worker-1' }
  }));
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/rest/v1/profiles?')) return jsonResponse([{ id: 'auth-worker-1', role: 'worker', status: 'active' }]);
    if (url.includes('/rest/v1/workers?')) return jsonResponse([{ id: 'worker-row-1', facility_id: 'facility-1', auth_user_id: 'auth-worker-1' }]);
    if (url.includes('/rest/v1/reports')) return jsonResponse([{ id: 'report-1', status: 'draft', worker_id: 'worker-row-1', facility_id: 'facility-1' }]);
    throw new Error('Unexpected request: ' + url);
  };
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch,
    storage,
    now: () => 1_800_000_000_000
  });
  const [report] = await client.createReportDraft({
    originalText: 'Synthetic aggregate fever count only',
    languageCode: 'hi',
    workerId: 'attacker-selected-worker'
  });
  assert.equal(report.worker_id, 'worker-row-1');
  assert.equal(report.facility_id, 'facility-1');
  const body = JSON.parse(calls.at(-1).options.body);
  assert.equal(body.worker_id, 'worker-row-1');
  assert.equal(body.facility_id, 'facility-1');
  assert.equal(body.status, 'draft');
  assert.notEqual(body.worker_id, 'attacker-selected-worker');
});

test('sign-out clears the browser session even when the remote logout request fails', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_at: 1_800_003_000,
    user: { id: 'user-3' }
  }));
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch: async () => { throw new Error('offline'); },
    storage,
    now: () => 1_800_000_000_000
  });
  await client.signOut();
  assert.equal(storage.has('busho-auth-session-v1'), false);
});
