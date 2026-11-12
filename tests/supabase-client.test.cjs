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

test('concurrent requests share one rotating refresh-token exchange', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'expired-access-token',
    refresh_token: 'single-use-refresh-token',
    expires_at: 1_799_999_999,
    user: { id: 'user-concurrent-refresh' }
  }));

  const refreshCalls = [];
  const profileCalls = [];
  let releaseRefresh;
  const refreshGate = new Promise(resolve => { releaseRefresh = resolve; });
  let announceRefreshStarted;
  const refreshStarted = new Promise(resolve => { announceRefreshStarted = resolve; });

  const fetch = async (url, options = {}) => {
    if (url.includes('/auth/v1/token?grant_type=refresh_token')) {
      refreshCalls.push(JSON.parse(options.body));
      announceRefreshStarted();
      await refreshGate;
      return jsonResponse({
        access_token: 'rotated-access-token',
        refresh_token: 'rotated-refresh-token',
        expires_in: 3600,
        user: { id: 'user-concurrent-refresh' }
      });
    }
    if (url.includes('/rest/v1/profiles?')) {
      profileCalls.push(options.headers.Authorization);
      return jsonResponse([{
        id: 'user-concurrent-refresh',
        role: 'worker',
        status: 'active'
      }]);
    }
    if (url.includes('/rest/v1/reports?')) {
      assert.equal(options.headers.Authorization, 'Bearer rotated-access-token');
      return jsonResponse([]);
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

  const first = client.listMyReports();
  await refreshStarted;
  const second = client.listMyReports();
  await Promise.resolve();
  assert.equal(refreshCalls.length, 1, 'only one refresh request may use the rotating token');

  releaseRefresh();
  await Promise.all([first, second]);

  assert.equal(refreshCalls.length, 1);
  assert.deepEqual(refreshCalls[0], { refresh_token: 'single-use-refresh-token' });
  assert.equal(profileCalls.length, 2);
  assert.ok(profileCalls.every(value => value === 'Bearer rotated-access-token'));

  const stored = JSON.parse(storage.getItem('busho-auth-session-v1'));
  assert.equal(stored.access_token, 'rotated-access-token');
  assert.equal(stored.refresh_token, 'rotated-refresh-token');
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
    if (url.includes('/rest/v1/profiles?')) return jsonResponse([{ id: 'user-2', role: 'worker', status: 'active' }]);
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
  assert.ok(calls[1].url.includes('/rest/v1/profiles?'));
  assert.equal(calls[2].options.headers.Authorization, 'Bearer refreshed-access-token');
  assert.equal(calls[2].options.headers.apikey, 'sb_publishable_demo_key');
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
  const report = await client.createReportDraft({
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
  assert.ok(calls.some(call => call.url.includes('facilities(name,district,block_lgd_code)')));
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

test('report item replacement deletes the prior editable set before inserting the new set', async () => {
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
    if (options.method === 'DELETE') return jsonResponse(null, 204);
    if (options.method === 'POST') return jsonResponse([{ id: 'item-1', report_id: 'report-1' }]);
    throw new Error('Unexpected request: ' + options.method + ' ' + url);
  };
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch,
    storage,
    now: () => 1_800_000_000_000
  });
  const result = await client.replaceReportItems('report-1', [{
    item_type: 'symptom_trend',
    display_label: 'Fever',
    quantity: 3,
    unit: 'patients',
    requires_review: true
  }]);
  assert.deepEqual(calls.map(call => call.options.method), ['DELETE', 'POST']);
  assert.ok(calls[0].url.includes('report_items?report_id=eq.report-1'));
  assert.ok(calls[1].url.includes('report_items'));
  assert.equal(JSON.parse(calls[1].options.body)[0].display_label, 'Fever');
  assert.equal(result[0].report_id, 'report-1');
});

test('worker can update only the report draft fields through the authenticated REST client', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'worker-token',
    refresh_token: 'worker-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'auth-worker-1' }
  }));
  let request;
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch: async (url, options) => {
      request = { url, options };
      return jsonResponse([{ id: 'report-1', status: 'correction_requested' }]);
    },
    storage,
    now: () => 1_800_000_000_000
  });
  const updated = await client.updateReportDraft('report-1', {
    originalText: 'Updated aggregate field report',
    languageCode: 'hi',
    reportingDate: '2026-11-07',
    summary: { extraction_version: 1, review_required: true }
  });
  assert.equal(updated.status, 'correction_requested');
  assert.equal(request.options.method, 'PATCH');
  const body = JSON.parse(request.options.body);
  assert.deepEqual(body, {
    original_text: 'Updated aggregate field report',
    language_code: 'hi',
    summary: { extraction_version: 1, review_required: true },
    reporting_date: '2026-11-07'
  });
  assert.ok(request.url.includes('reports?id=eq.report-1'));
});

test('supervisor inbox query uses the authenticated profile and embeds report items, events, worker and facility', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'supervisor-token',
    refresh_token: 'supervisor-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'auth-supervisor-1' }
  }));
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/rest/v1/profiles?')) {
      return jsonResponse([{ id: 'auth-supervisor-1', role: 'supervisor', status: 'active' }]);
    }
    if (url.includes('/rest/v1/reports?')) {
      return jsonResponse([{
        id: 'report-1',
        status: 'submitted',
        report_items: [{ id: 'item-1', display_label: 'Fever' }],
        report_events: [{ id: 'event-1', action: 'report_submitted' }],
        workers: { display_name: 'Worker A' },
        facilities: { name: 'Facility A' }
      }]);
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
  const rows = await client.listSupervisorReports();
  assert.equal(rows[0].report_items[0].display_label, 'Fever');
  assert.equal(rows[0].report_events[0].action, 'report_submitted');
  assert.equal(rows[0].workers.display_name, 'Worker A');
  assert.equal(rows[0].facilities.name, 'Facility A');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.headers.Authorization, 'Bearer supervisor-token');
  assert.ok(calls[1].url.includes('status=in.(submitted,resubmitted,supervisor_verified,correction_requested,escalated,rejected,closed)'));
  assert.ok(calls[1].url.includes('report_items(*)'));
  assert.ok(calls[1].url.includes('report_events(*)'));
  assert.ok(calls[1].url.includes('workers(display_name'));
  assert.ok(calls[1].url.includes('facilities(name'));
});

test('worker profile cannot call the supervisor inbox query', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'worker-token',
    refresh_token: 'worker-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'auth-worker-1' }
  }));
  const calls = [];
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch: async url => {
      calls.push(url);
      if (url.includes('/rest/v1/profiles?')) {
        return jsonResponse([{ id: 'auth-worker-1', role: 'worker', status: 'active' }]);
      }
      throw new Error('The report inbox must not be queried by a worker.');
    },
    storage,
    now: () => 1_800_000_000_000
  });
  await assert.rejects(client.listSupervisorReports(), /not available to the worker role/i);
  assert.equal(calls.length, 1);
});

test('worker report history is role-gated and includes the related facility display context', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'worker-token',
    refresh_token: 'worker-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'auth-worker-1' }
  }));
  const calls = [];
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/rest/v1/profiles?')) {
        return jsonResponse([{ id: 'auth-worker-1', role: 'worker', status: 'active' }]);
      }
      if (url.includes('/rest/v1/reports?')) {
        return jsonResponse([{
          id: 'report-1',
          status: 'correction_requested',
          facilities: { name: 'Facility A' },
          report_items: [],
          report_events: []
        }]);
      }
      throw new Error('Unexpected request: ' + url);
    },
    storage,
    now: () => 1_800_000_000_000
  });
  const rows = await client.listMyReports();
  assert.equal(rows[0].status, 'correction_requested');
  assert.equal(rows[0].facilities.name, 'Facility A');
  assert.ok(calls[1].url.includes('facilities(name,district,block_lgd_code)'));
  assert.equal(calls[1].options.headers.Authorization, 'Bearer worker-token');
});

test('invitation acceptance stores a verified session and lets the invitee set a strong password', async () => {
  const storage = makeStorage();
  const calls = [];
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    storage,
    now: () => 1_800_000_000_000,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/auth/v1/user') && options.method === 'GET') {
        return jsonResponse({ id: 'invited-user-1', email: 'worker@example.org' });
      }
      if (url.endsWith('/auth/v1/user') && options.method === 'PUT') {
        return jsonResponse({ id: 'invited-user-1', email: 'worker@example.org', updated_at: '2026-11-07T12:00:00Z' });
      }
      throw new Error('Unexpected request: ' + url + ' ' + options.method);
    }
  });
  const accepted = await client.setSessionFromUrlHash(
    '#access_token=invite-access&refresh_token=invite-refresh&expires_in=3600&type=invite'
  );
  assert.equal(accepted.session.user.id, 'invited-user-1');
  assert.equal(client.getSession().refresh_token, 'invite-refresh');
  const updated = await client.updatePassword('a-long-secure-password-2026');
  assert.equal(updated.id, 'invited-user-1');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer invite-access');
  assert.equal(calls[1].options.method, 'PUT');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer invite-access');
  assert.deepEqual(JSON.parse(calls[1].options.body), { password: 'a-long-secure-password-2026' });
});

test('invitation acceptance rejects non-invite links and weak passwords', async () => {
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    storage: makeStorage(),
    fetch: async () => { throw new Error('No network request should occur.'); }
  });
  await assert.rejects(
    client.setSessionFromUrlHash('#access_token=a&refresh_token=b&type=recovery'),
    /not intended for account setup/i
  );
  await assert.rejects(client.updatePassword('short'), /between 12 and 128 characters/i);
});

test('administrator provisioning call requires an active state or district admin and sends the user JWT', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'state-admin-token',
    refresh_token: 'state-admin-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'auth-state-admin' }
  }));
  const calls = [];
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    storage,
    now: () => 1_800_000_000_000,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/rest/v1/profiles?')) {
        return jsonResponse([{ id: 'auth-state-admin', role: 'state_admin', status: 'active' }]);
      }
      if (url.includes('/functions/v1/provision-user')) {
        return jsonResponse({ ok: true, invitation: { userId: 'new-user', role: 'worker', status: 'invited' } }, 201);
      }
      throw new Error('Unexpected request: ' + url);
    }
  });
  const input = { email: 'worker@example.org', displayName: 'Worker A', role: 'worker', facilityIds: ['facility-id'] };
  const result = await client.provisionUser(input);
  assert.equal(result.invitation.userId, 'new-user');
  const call = calls.find(item => item.url.includes('/functions/v1/provision-user'));
  assert.equal(call.options.headers.Authorization, 'Bearer state-admin-token');
  assert.equal(call.options.headers.apikey, 'sb_publishable_demo_key');
  assert.deepEqual(JSON.parse(call.options.body), input);
});

test('worker role cannot call the administrator provisioning function', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'worker-token',
    refresh_token: 'worker-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'auth-worker' }
  }));
  const calls = [];
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    storage,
    now: () => 1_800_000_000_000,
    fetch: async url => {
      calls.push(url);
      return jsonResponse([{ id: 'auth-worker', role: 'worker', status: 'active' }]);
    }
  });
  await assert.rejects(client.provisionUser({ role: 'platform_admin' }), /not available to the worker role/i);
  assert.equal(calls.some(url => url.includes('/functions/v1/provision-user')), false);
});

test('platform administrator can request provisioning options and create state-level invitations', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'platform-token',
    refresh_token: 'platform-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'auth-platform-admin' }
  }));
  const calls = [];
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    storage,
    now: () => 1_800_000_000_000,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/rest/v1/profiles?')) {
        return jsonResponse([{ id: 'auth-platform-admin', role: 'platform_admin', status: 'active' }]);
      }
      if (url.includes('/rest/v1/facilities?')) return jsonResponse([]);
      if (url.includes('/rest/v1/districts?')) return jsonResponse([{ lgd_code: '101', name: 'Balod', state_lgd_code: '22' }]);
      if (url.includes('/functions/v1/provision-user')) {
        return jsonResponse({ ok: true, invitation: { userId: 'new-state-admin', role: 'state_admin', status: 'invited' } }, 201);
      }
      throw new Error('Unexpected request: ' + url);
    }
  });
  const options = await client.listProvisioningOptions();
  assert.equal(options.facilities.length, 0);
  assert.equal(options.districts[0].name, 'Balod');
  assert.ok(calls.some(call => call.url.includes('/rest/v1/districts?')));
  const result = await client.provisionUser({
    email: 'state@example.org',
    displayName: 'State Admin',
    role: 'state_admin',
    scope: { level: 'state', stateLgdCode: '22', districtLgdCode: '' },
    facilityIds: []
  });
  assert.equal(result.invitation.role, 'state_admin');
  const provisionCall = calls.find(call => call.url.includes('/functions/v1/provision-user'));
  assert.equal(provisionCall.options.headers.Authorization, 'Bearer platform-token');
});

test('facility registry client requires an active administrator and calls the server-only Edge Function', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'admin-token',
    refresh_token: 'admin-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'admin-user' }
  }));
  const calls = [];
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    storage,
    now: () => 1_800_000_000_000,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/rest/v1/profiles?')) {
        return jsonResponse([{ id: 'admin-user', role: 'state_admin', status: 'active' }]);
      }
      if (url.includes('/functions/v1/facility-registry')) {
        return jsonResponse({ ok: true, result: { staged: 2 } });
      }
      throw new Error('Unexpected request: ' + url);
    }
  });
  const result = await client.manageFacilityRegistry({
    action: 'stage_candidates',
    batchId: 'batch-id',
    candidates: [{ external_registry_id: 'X1' }, { external_registry_id: 'X2' }]
  });
  assert.equal(result.result.staged, 2);
  const call = calls.find(item => item.url.includes('/functions/v1/facility-registry'));
  assert.equal(call.options.headers.Authorization, 'Bearer admin-token');
  assert.equal(call.options.headers.apikey, 'sb_publishable_demo_key');
  assert.equal(call.options.headers['Content-Type'], 'application/json');
  assert.doesNotMatch(JSON.stringify(call.options.headers), /service_role|secret_key/i);
});

test('facility registry client rejects worker profiles before making privileged calls', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'worker-token',
    refresh_token: 'worker-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'worker-user' }
  }));
  const calls = [];
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    storage,
    now: () => 1_800_000_000_000,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/rest/v1/profiles?')) {
        return jsonResponse([{ id: 'worker-user', role: 'worker', status: 'active' }]);
      }
      throw new Error('Unexpected privileged request: ' + url);
    }
  });
  await assert.rejects(() => client.manageFacilityRegistry({ action: 'create_batch' }), /not available to the worker role/i);
  assert.equal(calls.some(item => item.url.includes('/functions/v1/facility-registry')), false);
});


test('recommendation retry returns the original row only when the idempotency key payload matches', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'supervisor-token',
    refresh_token: 'supervisor-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'supervisor-1' }
  }));
  const calls = [];
  const payload = {
    facility_id: 'facility-1',
    inventory_item_id: 'item-1',
    requested_quantity: 8,
    status: 'recommended_to_facility_store',
    source_report_id: 'report-1',
    on_hand_quantity: 2,
    unit: 'packets',
    note: 'Synthetic retry',
    data_mode: 'synthetic_demo',
    submission_key: '123e4567-e89b-42d3-a456-426614174000'
  };
  const existing = {
    id: 'request-1',
    facility_id: 'facility-1',
    inventory_item_id: 'item-1',
    requested_quantity: 8,
    source_report_id: 'report-1',
    on_hand_quantity: 2,
    unit: 'packets',
    note: 'Synthetic retry',
    data_mode: 'synthetic_demo',
    submission_key: payload.submission_key,
    created_by_user_id: 'supervisor-1'
  };
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/rest/v1/profiles?')) {
      return jsonResponse([{ id: 'supervisor-1', role: 'supervisor', status: 'active' }]);
    }
    if (url.endsWith('/rest/v1/replenishment_requests') && options.method === 'POST') {
      return jsonResponse({ code: '23505', message: 'duplicate key value violates unique constraint' }, 409);
    }
    if (url.includes('/rest/v1/replenishment_requests?select=id,facility_id')) {
      return jsonResponse([existing]);
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
  const result = await client.createReplenishmentRequest({
    facilityId: 'facility-1',
    inventoryItemId: 'item-1',
    requestedQuantity: 8,
    sourceReportId: 'report-1',
    onHandQuantity: 2,
    unit: 'packets',
    note: 'Synthetic retry',
    dataMode: 'synthetic_demo',
    submissionKey: payload.submission_key
  });
  assert.equal(result.id, 'request-1');
  assert.equal(calls.filter(call => call.options.method === 'POST').length, 1);
  assert.ok(calls.some(call => call.url.includes('created_by_user_id=eq.supervisor-1')));
});

test('recommendation retry rejects reuse of a submission key with different details', async () => {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token: 'supervisor-token',
    refresh_token: 'supervisor-refresh',
    expires_at: 1_800_003_000,
    user: { id: 'supervisor-1' }
  }));
  const existing = {
    id: 'request-1', facility_id: 'facility-1', inventory_item_id: 'item-1',
    requested_quantity: 8, source_report_id: 'report-1', on_hand_quantity: 2,
    unit: 'packets', note: 'Original', data_mode: 'synthetic_demo',
    submission_key: '123e4567-e89b-42d3-a456-426614174000',
    created_by_user_id: 'supervisor-1'
  };
  const fetch = async (url, options) => {
    if (url.includes('/rest/v1/profiles?')) {
      return jsonResponse([{ id: 'supervisor-1', role: 'supervisor', status: 'active' }]);
    }
    if (url.endsWith('/rest/v1/replenishment_requests') && options.method === 'POST') {
      return jsonResponse({ code: '23505', message: 'duplicate key value violates unique constraint' }, 409);
    }
    if (url.includes('/rest/v1/replenishment_requests?select=id,facility_id')) return jsonResponse([existing]);
    throw new Error('Unexpected request: ' + url);
  };
  const client = createClient({
    url: 'https://demo.supabase.co',
    publishableKey: 'sb_publishable_demo_key',
    fetch,
    storage,
    now: () => 1_800_000_000_000
  });
  await assert.rejects(client.createReplenishmentRequest({
    facilityId: 'facility-1', inventoryItemId: 'item-1',
    requestedQuantity: 9, sourceReportId: 'report-1', onHandQuantity: 2,
    unit: 'packets', note: 'Changed', dataMode: 'synthetic_demo',
    submissionKey: existing.submission_key
  }), /different recommendation details/i);
});
