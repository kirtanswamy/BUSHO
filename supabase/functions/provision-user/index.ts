import { withSupabase } from 'npm:@supabase/server';
import { provisionUser } from '../_shared/provisioning-service.mjs';
import { ProvisioningError } from '../_shared/provisioning-policy.mjs';

const APP_ORIGIN = (Deno.env.get('BUSHO_APP_ORIGIN') || 'https://busho.de5.net').replace(/\/+$/, '');
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('BUSHO_ALLOWED_ORIGINS') || APP_ORIGIN)
    .split(',')
    .map(value => value.trim().replace(/\/+$/, ''))
    .filter(Boolean)
);

function corsHeaders(origin) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function jsonResponse(body, status, origin) {
  const headers = corsHeaders(origin);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), { status, headers });
}

function throwOnError(result, message) {
  if (result?.error) throw new Error(message + ': ' + result.error.message);
  return result?.data;
}

async function readJsonBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new ProvisioningError(400, 'A JSON request body is required.', 'invalid_body');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 12_000) {
        await reader.cancel();
        throw new ProvisioningError(413, 'Request body is too large.', 'body_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ProvisioningError(400, 'A valid JSON body is required.', 'invalid_body');
  }
}

const authenticatedHandler = withSupabase({ auth: 'user' }, async (req, ctx) => {
  const origin = req.headers.get('origin');
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405, origin);

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse({ error: 'Content-Type must be application/json.' }, 415, origin);
  }
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > 12_000) return jsonResponse({ error: 'Request body is too large.', code: 'body_too_large' }, 413, origin);

  let input;
  try { input = await readJsonBody(req); }
  catch (error) {
    const status = error instanceof ProvisioningError ? error.status : 400;
    return jsonResponse({
      error: error instanceof ProvisioningError ? error.message : 'A valid JSON body is required.',
      code: error.code || 'invalid_body'
    }, status, origin);
  }

  const callerId = ctx.userClaims?.id;
  if (!callerId || !ctx.supabaseAdmin) {
    return jsonResponse({ error: 'An authenticated administrator session is required.' }, 401, origin);
  }

  const admin = ctx.supabaseAdmin;
  const callerProfileResult = await admin
    .from('profiles')
    .select('id,role,status')
    .eq('id', callerId)
    .maybeSingle();
  const callerProfile = throwOnError(callerProfileResult, 'Unable to verify administrator profile');
  if (!callerProfile) return jsonResponse({ error: 'Administrator profile was not found.' }, 403, origin);

  const scopesResult = await admin
    .from('user_scope_assignments')
    .select('scope_level,state_lgd_code,district_lgd_code,scope_role,is_active,valid_from,valid_until')
    .eq('user_id', callerId)
    .eq('is_active', true);
  const callerScopes = throwOnError(scopesResult, 'Unable to verify administrator scope') || [];

  const repository = {
    async listFacilities(ids) {
      const result = await admin.from('facilities')
        .select('id,name,state_lgd_code,district_lgd_code,verification_status,is_synthetic,is_active')
        .in('id', ids);
      return throwOnError(result, 'Unable to verify facility assignments') || [];
    },
    async getDistrict(code) {
      const result = await admin.from('districts')
        .select('lgd_code,state_lgd_code,name')
        .eq('lgd_code', code)
        .maybeSingle();
      return throwOnError(result, 'Unable to verify district scope');
    },
    async activateProfile(id, payload) {
      const result = await admin.from('profiles')
        .update(payload)
        .eq('id', id)
        .select('id')
        .maybeSingle();
      const rows = throwOnError(result, 'Unable to activate invited profile');
      if (!rows?.id) throw new Error('The Auth trigger did not create a profile row.');
    },
    async insertWorker(payload) {
      const result = await admin.from('workers').insert(payload).select('id').single();
      return throwOnError(result, 'Unable to create worker record');
    },
    async insertFacilityAssignments(rows) {
      const result = await admin.from('user_facility_assignments').insert(rows);
      throwOnError(result, 'Unable to create facility assignments');
    },
    async insertScopeAssignment(row) {
      const result = await admin.from('user_scope_assignments').insert(row);
      throwOnError(result, 'Unable to create administrative scope assignment');
    },
    async insertAuditLog(row) {
      const result = await admin.from('audit_logs').insert(row);
      throwOnError(result, 'Unable to write provisioning audit record');
    },
    async suspendProfile(id) {
      const result = await admin.from('profiles').update({ status: 'suspended' }).eq('id', id);
      throwOnError(result, 'Unable to suspend partially provisioned profile');
    },
    async rollbackAssignments(id) {
      for (const [table, column] of [
        ['workers', 'auth_user_id'],
        ['user_facility_assignments', 'user_id'],
        ['user_scope_assignments', 'user_id']
      ]) {
        const result = await admin.from(table).delete().eq(column, id);
        throwOnError(result, 'Unable to roll back ' + table);
      }
    }
  };

  const authAdmin = {
    async inviteUserByEmail(email, options) {
      const result = await admin.auth.admin.inviteUserByEmail(email, options);
      if (result.error) throw new Error(result.error.message || 'Auth invitation failed.');
      return result.data?.user || null;
    },
    async deleteUser(id) {
      const result = await admin.auth.admin.deleteUser(id);
      if (result.error) throw new Error(result.error.message || 'Unable to remove failed invitation.');
    }
  };

  try {
    const result = await provisionUser({
      authAdmin,
      repository,
      callerProfile,
      callerScopes,
      input,
      appOrigin: APP_ORIGIN
    });
    return jsonResponse({ ok: true, invitation: result }, 201, origin);
  } catch (error) {
    const status = error instanceof ProvisioningError ? error.status : 500;
    const message = error instanceof ProvisioningError
      ? error.message
      : 'The provisioning request could not be completed.';
    return jsonResponse({ error: message, code: error.code || 'provisioning_failed' }, status, origin);
  }
});

Deno.serve(async req => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: 'Origin is not allowed.' }, 403, null);
    }
    return new Response('ok', { status: 200, headers: corsHeaders(origin) });
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: 'Origin is not allowed.' }, 403, null);
  }
  try {
    const response = await authenticatedHandler(req);
    const headers = new Headers(response.headers);
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch {
    return jsonResponse({ error: 'The authenticated provisioning request failed.' }, 500, origin);
  }
});
