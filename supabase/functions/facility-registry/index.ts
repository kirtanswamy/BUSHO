import { withSupabase } from 'npm:@supabase/server';

const APP_ORIGIN = (Deno.env.get('BUSHO_APP_ORIGIN') || 'https://busho.de5.net').replace(/\/+$/, '');
const ALLOWED_ORIGINS = new Set((Deno.env.get('BUSHO_ALLOWED_ORIGINS') || APP_ORIGIN)
  .split(',').map(value => value.trim().replace(/\/+$/, '')).filter(Boolean));

function headers(origin) {
  const result = new Headers({
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8'
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) result.set('Access-Control-Allow-Origin', origin);
  return result;
}
function reply(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}
function fail(message, status = 400, code = 'invalid_request') {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  throw error;
}
function requiredString(value, label, max = 160) {
  const text = String(value ?? '').trim();
  if (!text || text.length > max) fail(label + ' is required and must be at most ' + max + ' characters.');
  return text;
}
function validateDate(value) {
  const text = requiredString(value, 'Source date', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || new Date(text + 'T00:00:00Z').toISOString().slice(0,10) !== text) {
    fail('Source date must be a valid YYYY-MM-DD date.');
  }
  if (text > new Date().toISOString().slice(0,10)) fail('Source date cannot be in the future.');
  return text;
}
function throwOnError(result, message) {
  if (result?.error) {
    const error = new Error(message + ': ' + result.error.message);
    error.code = result.error.code;
    throw error;
  }
  return result?.data;
}
async function readBody(req) {
  const reader = req.body?.getReader();
  if (!reader) fail('A JSON request body is required.');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_000_000) {
        await reader.cancel();
        fail('Request body exceeds the 1 MB limit.', 413, 'body_too_large');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { fail('A valid JSON body is required.'); }
}

const handler = withSupabase({ auth: 'user' }, async (req, ctx) => {
  const origin = req.headers.get('origin');
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return reply({ error: 'Origin is not allowed.' }, 403, origin);
  if (!(req.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
    return reply({ error: 'Content-Type must be application/json.' }, 415, origin);
  }
  const length = Number(req.headers.get('content-length') || 0);
  if (length > 1_000_000) return reply({ error: 'Request body exceeds the 1 MB limit.' }, 413, origin);
  let input;
  try { input = await readBody(req); }
  catch (error) { return reply({ error: error.message, code: error.code || 'invalid_body' }, error.status || 400, origin); }

  const actorId = ctx.userClaims?.id;
  const admin = ctx.supabaseAdmin;
  if (!actorId || !admin) return reply({ error: 'An authenticated administrator session is required.' }, 401, origin);

  try {
    const profile = throwOnError(await admin.from('profiles')
      .select('id,role,status').eq('id', actorId).maybeSingle(), 'Unable to verify administrator profile');
    if (!profile || profile.status !== 'active' || !['platform_admin','state_admin','district_admin'].includes(profile.role)) {
      return reply({ error: 'An active platform, state or district administrator is required.' }, 403, origin);
    }
    const scopes = throwOnError(await admin.from('user_scope_assignments')
      .select('scope_level,state_lgd_code,district_lgd_code,scope_role,is_active,valid_from,valid_until')
      .eq('user_id', actorId).eq('is_active', true), 'Unable to verify administrator scope') || [];
    const now = Date.now();
    const activeScopes = scopes.filter(scope =>
      (!scope.valid_from || new Date(scope.valid_from).getTime() <= now) &&
      (!scope.valid_until || new Date(scope.valid_until).getTime() > now)
    );
    if (profile.role === 'state_admin' && !activeScopes.some(s =>
      s.scope_level === 'state' && s.scope_role === 'state_admin' && s.state_lgd_code === '22')) {
      return reply({ error: 'Your account has no active Chhattisgarh state scope.' }, 403, origin);
    }
    if (profile.role === 'district_admin' && !activeScopes.some(s =>
      s.scope_level === 'district' && s.scope_role === 'district_admin' && s.state_lgd_code === '22')) {
      return reply({ error: 'Your account has no active Chhattisgarh district scope.' }, 403, origin);
    }

    const action = requiredString(input.action, 'Action', 40);
    if (action === 'create_batch') {
      const sourceAuthority = requiredString(input.sourceAuthority, 'Source authority');
      const sourceDate = validateDate(input.sourceDate);
      let sourceUrl;
      try { sourceUrl = new URL(requiredString(input.sourceUrl, 'Source URL', 1000)); }
      catch { fail('A valid HTTPS source URL is required.'); }
      if (sourceUrl.protocol !== 'https:') fail('Source URL must use HTTPS.');
      const expectedRows = Number(input.expectedRows);
      if (!Number.isInteger(expectedRows) || expectedRows < 1 || expectedRows > 10000) {
        fail('Expected rows must be an integer between 1 and 10,000.');
      }
      const data = throwOnError(await admin.from('facility_registry_import_batches').insert({
        source_authority: sourceAuthority,
        source_date: sourceDate,
        source_url: sourceUrl.toString(),
        imported_by: actorId,
        expected_rows: expectedRows
      }).select('id,source_authority,source_date,source_url,status,expected_rows,received_rows,verified_rows,rejected_rows,created_at').single(), 'Unable to create facility import batch');
      throwOnError(await admin.from('audit_logs').insert({
        actor_worker_id: null, action: 'facility_registry_batch_created',
        entity_type: 'facility_registry_import_batch', entity_id: data.id,
        metadata: { actor_id: actorId, expected_rows: expectedRows, source_authority: sourceAuthority, source_date: sourceDate }
      }), 'Unable to record facility import audit event');
      return reply({ ok: true, batch: data }, 201, origin);
    }

    if (action === 'stage_candidates') {
      const batchId = requiredString(input.batchId, 'Batch ID', 36);
      if (!Array.isArray(input.candidates) || input.candidates.length < 1 || input.candidates.length > 250) {
        fail('Stage between 1 and 250 candidates per request.');
      }
      const batch = throwOnError(await admin.from('facility_registry_import_batches')
        .select('id,imported_by,status').eq('id', batchId).eq('imported_by', actorId).maybeSingle(), 'Unable to verify import batch');
      if (!batch || !['staging','reviewing'].includes(batch.status)) return reply({ error: 'Import batch not found or not open.' }, 404, origin);
      const candidates = input.candidates.map((row, index) => ({
        external_registry_id: requiredString(row.external_registry_id, 'External registry ID', 120),
        name: requiredString(row.name, 'Facility name', 180),
        state_lgd_code: requiredString(row.state_lgd_code, 'State LGD code', 8),
        district_lgd_code: requiredString(row.district_lgd_code, 'District LGD code', 8),
        block_lgd_code: String(row.block_lgd_code || '').trim() || null,
        facility_type: requiredString(row.facility_type, 'Facility type', 32),
        source_row: Number(row.source_row) || (index + 2)
      }));
      const data = throwOnError(await admin.rpc('stage_facility_registry_candidates', {
        p_batch_id: batchId, p_actor_id: actorId, p_candidates: candidates
      }), 'Unable to stage facility candidates');
      return reply({ ok: true, result: data }, 200, origin);
    }

    if (action === 'list_batch') {
      const batchId = requiredString(input.batchId, 'Batch ID', 36);
      const batch = throwOnError(await admin.from('facility_registry_import_batches')
        .select('*').eq('id', batchId).eq('imported_by', actorId).maybeSingle(), 'Unable to load import batch');
      if (!batch) return reply({ error: 'Import batch not found.' }, 404, origin);
      const page = Math.max(0, Math.min(99, Number.isInteger(Number(input.page)) ? Number(input.page) : 0));
      const from = page * 100;
      const result = await admin.from('facility_registry_candidates')
        .select('id,external_registry_id,name,state_lgd_code,district_lgd_code,block_lgd_code,facility_type,source_row,review_flags,verification_status,review_note,reviewed_by,reviewed_at,facility_id', { count: 'exact' })
        .eq('batch_id', batchId).order('source_row', { ascending: true }).range(from, from + 99);
      const candidates = throwOnError(result, 'Unable to load facility candidates');
      return reply({ ok: true, batch, candidates: candidates || [], page, total: result.count || 0, pageSize: 100 }, 200, origin);
    }

    if (action === 'review_candidate') {
      const candidateId = requiredString(input.candidateId, 'Candidate ID', 36);
      const decision = requiredString(input.decision, 'Review decision', 10);
      const note = requiredString(input.reviewNote, 'Review note', 1000);
      if (note.length < 8) fail('Review note must contain at least 8 characters.');
      if (!['verify','reject'].includes(decision)) fail('Decision must be verify or reject.');
      const data = throwOnError(await admin.rpc('review_facility_registry_candidate', {
        p_candidate_id: candidateId, p_reviewer_id: actorId, p_decision: decision, p_review_note: note
      }), 'Unable to review facility candidate');
      return reply({ ok: true, result: data }, 200, origin);
    }

    if (action === 'complete_batch') {
      const batchId = requiredString(input.batchId, 'Batch ID', 36);
      const data = throwOnError(await admin.rpc('complete_facility_registry_batch', {
        p_batch_id: batchId, p_actor_id: actorId
      }), 'Unable to complete facility batch');
      return reply({ ok: true, result: data }, 200, origin);
    }

    return reply({ error: 'Unsupported facility registry action.' }, 400, origin);
  } catch (error) {
    const status = error.status || (error.code === '42501' ? 403 : error.code === '23505' ? 409 : error.code === 'P0002' ? 404 : 400);
    return reply({ error: error.message || 'Facility registry request failed.', code: error.code || 'facility_registry_error' }, status, origin);
  }
});

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
    return new Response('ok', { headers: headers(origin) });
  }
  return handler(req);
});
