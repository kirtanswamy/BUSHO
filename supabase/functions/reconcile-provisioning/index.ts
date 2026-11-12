import { withSupabase } from 'npm:@supabase/server';

const APP_ORIGIN = (Deno.env.get('BUSHO_APP_ORIGIN') || 'https://busho.de5.net').replace(/\\/+$/, '');
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('BUSHO_ALLOWED_ORIGINS') || APP_ORIGIN)
    .split(',')
    .map(value => value.trim().replace(/\\/+$/, ''))
    .filter(Boolean)
);

function response(body: unknown, status: number, origin: string | null) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
  return new Response(JSON.stringify(body), { status, headers });
}

function dataOrThrow(result: any, label: string) {
  if (result?.error) throw new Error(label + ': ' + result.error.message);
  return result?.data;
}

function classify(op: any, authExists: boolean, profile: any, worker: any, facilityAssignments: any[], scopeAssignments: any[]) {
  if (!authExists) return { code: 'auth_user_missing', action: 'manual_review_auth_missing' };
  if (!profile) return { code: 'profile_missing', action: 'manual_review_profile_missing' };
  if (profile.status !== 'active') return { code: 'profile_not_active', action: 'review_and_repair_or_suspend' };

  const payload = op.request_payload || {};
  const expectedFacilities: string[] = Array.isArray(payload.facility_ids) ? payload.facility_ids : [];
  const expectedRole = op.target_role;
  const facilityAssignmentsComplete = expectedFacilities.every(id =>
    facilityAssignments.some(row => row.facility_id === id && row.assignment_role === expectedRole && row.is_active === true)
  );
  const workerComplete = expectedRole !== 'worker' ||
    Boolean(worker && worker.is_active === true && worker.facility_id === expectedFacilities[0]);
  const scope = payload.scope || null;
  const scopeComplete = !['district_admin', 'state_admin'].includes(expectedRole) ||
    scopeAssignments.some(row =>
      row.scope_role === expectedRole && row.scope_level === scope?.level &&
      row.state_lgd_code === scope?.stateLgdCode &&
      (expectedRole !== 'district_admin' || row.district_lgd_code === scope?.districtLgdCode) &&
      row.is_active === true
    );

  if (profile.role !== expectedRole || !facilityAssignmentsComplete || !workerComplete || !scopeComplete) {
    return {
      code: 'active_account_relationship_mismatch',
      action: 'manual_review_suspend_or_repair',
      checks: { facilityAssignmentsComplete, workerComplete, scopeComplete, profileRoleMatches: profile.role === expectedRole }
    };
  }
  return {
    code: 'account_relationships_appear_complete',
    action: 'verify_audit_event_then_close_operation',
    checks: { facilityAssignmentsComplete, workerComplete, scopeComplete, profileRoleMatches: true }
  };
}

const handler = withSupabase({ auth: 'user' }, async (req, ctx) => {
  const origin = req.headers.get('origin');
  if (req.method !== 'GET') return response({ error: 'Method not allowed.' }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return response({ error: 'Origin is not allowed.' }, 403, null);

  const callerId = ctx.userClaims?.id;
  if (!callerId || !ctx.supabaseAdmin) return response({ error: 'An authenticated platform administrator is required.' }, 401, origin);

  try {
    const admin = ctx.supabaseAdmin;
    const profileResult = await admin.from('profiles').select('id,role,status').eq('id', callerId).maybeSingle();
    const caller = dataOrThrow(profileResult, 'Unable to verify caller');
    if (!caller || caller.role !== 'platform_admin' || caller.status !== 'active') {
      return response({ error: 'Only an active platform administrator may inspect provisioning operations.' }, 403, origin);
    }

    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const operationsResult = await admin.from('provisioning_operations')
      .select('id,requested_by,idempotency_key,target_email,target_role,status,current_step,auth_user_id,request_payload,error_code,started_at,updated_at')
      .or('status.eq.reconciliation_required,and(status.eq.in_progress,updated_at.lt.' + cutoff + ')')
      .order('updated_at', { ascending: true })
      .limit(50);
    const operations = dataOrThrow(operationsResult, 'Unable to load incomplete provisioning operations') || [];

    const findings = await Promise.all(operations.map(async (op: any) => {
      const authId = op.auth_user_id;
      if (!authId) {
        return {
          operationId: op.id, requestedBy: op.requested_by, email: op.target_email,
          role: op.target_role, status: op.status, currentStep: op.current_step,
          startedAt: op.started_at, updatedAt: op.updated_at, authUserExists: null,
          classification: 'auth_identity_not_checkpointed',
          recommendedAction: 'inspect_auth_by_exact_email_before_any_retry_or_cleanup'
        };
      }

      const authResult = await admin.auth.admin.getUserById(authId);
      const authExists = !authResult.error && Boolean(authResult.data?.user);
      if (authResult.error && !/not found|user not found/i.test(authResult.error.message || '')) {
        throw new Error('Unable to verify Auth identity for operation ' + op.id);
      }
      if (!authExists) {
        return {
          operationId: op.id, requestedBy: op.requested_by, email: op.target_email,
          role: op.target_role, status: op.status, currentStep: op.current_step,
          startedAt: op.started_at, updatedAt: op.updated_at, authUserExists: false,
          classification: 'auth_user_missing',
          recommendedAction: 'manual_review_auth_missing'
        };
      }

      const [profileResult, workerResult, facilitiesResult, scopesResult] = await Promise.all([
        admin.from('profiles').select('id,role,status').eq('id', authId).maybeSingle(),
        admin.from('workers').select('id,facility_id,is_active').eq('auth_user_id', authId).maybeSingle(),
        admin.from('user_facility_assignments').select('facility_id,assignment_role,is_active').eq('user_id', authId),
        admin.from('user_scope_assignments').select('scope_level,state_lgd_code,district_lgd_code,scope_role,is_active').eq('user_id', authId)
      ]);
      const profile = dataOrThrow(profileResult, 'Unable to inspect profile');
      const worker = dataOrThrow(workerResult, 'Unable to inspect worker record');
      const facilities = dataOrThrow(facilitiesResult, 'Unable to inspect facility assignments') || [];
      const scopes = dataOrThrow(scopesResult, 'Unable to inspect scope assignments') || [];
      const assessment = classify(op, true, profile, worker, facilities, scopes);

      return {
        operationId: op.id, requestedBy: op.requested_by, email: op.target_email,
        role: op.target_role, status: op.status, currentStep: op.current_step,
        startedAt: op.started_at, updatedAt: op.updated_at, authUserExists: true,
        profile: profile ? { role: profile.role, status: profile.status } : null,
        classification: assessment.code,
        recommendedAction: assessment.action,
        checks: assessment.checks || null
      };
    }));

    return response({
      ok: true,
      readOnly: true,
      staleInProgressMinutes: 5,
      inspectedCount: findings.length,
      findings
    }, 200, origin);
  } catch {
    return response({ error: 'Unable to inspect provisioning operations safely.' }, 500, origin);
  }
});

Deno.serve(req => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return response({ error: 'Origin is not allowed.' }, 403, null);
    const headers = new Headers({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    });
    return new Response('ok', { status: 200, headers });
  }
  return handler(req);
});
