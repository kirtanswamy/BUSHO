import {
  assertCanProvision,
  assertDistrictAssignmentAllowed,
  assertFacilityAssignmentsAllowed,
  validateProvisioningInput,
  ProvisioningError
} from './provisioning-policy.mjs';

export async function provisionUser({
  authAdmin,
  repository,
  callerProfile,
  callerScopes,
  input,
  appOrigin,
  now = () => new Date()
}) {
  const request = validateProvisioningInput(input);
  const activeScopes = assertCanProvision(callerProfile, callerScopes, request, now());
  const idempotencyKey = String(input?.idempotencyKey || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    throw new ProvisioningError(400, 'A valid provisioning request key is required.', 'invalid_idempotency_key');
  }

  let facilities = [];
  if (request.facilityIds.length) {
    facilities = await repository.listFacilities(request.facilityIds);
    if (facilities.length !== request.facilityIds.length) {
      throw new ProvisioningError(422, 'One or more selected facilities do not exist or are not visible in your scope.', 'facility_lookup_failed');
    }
    assertFacilityAssignmentsAllowed(callerProfile, activeScopes, facilities);
  }

  let district = null;
  if (request.role === 'district_admin') {
    district = await repository.getDistrict(request.scope.districtLgdCode);
    assertDistrictAssignmentAllowed(callerProfile, activeScopes, district);
  }

  const requestFingerprint = JSON.stringify({
    email: request.email,
    displayName: request.displayName,
    role: request.role,
    preferredLanguage: request.preferredLanguage,
    facilityIds: [...request.facilityIds].sort(),
    scope: request.scope
  });
  const operation = await repository.createProvisioningOperation({
    requested_by: callerProfile.id,
    idempotency_key: idempotencyKey,
    request_fingerprint: requestFingerprint,
    target_email: request.email,
    target_role: request.role,
    request_payload: {
      display_name: request.displayName,
      preferred_language: request.preferredLanguage,
      facility_ids: request.facilityIds,
      scope: request.scope,
      consent_confirmed: request.consentConfirmed
    },
    status: 'in_progress',
    current_step: 'accepted'
  });
  if (!operation?.id) {
    throw new ProvisioningError(500, 'The provisioning operation could not be recorded.', 'operation_record_failed');
  }
  if (operation.request_fingerprint !== requestFingerprint) {
    throw new ProvisioningError(409, 'This request key is already associated with different provisioning details. Do not reuse it for a changed request.', 'idempotency_payload_mismatch');
  }
  if (operation.status === 'completed' && operation.result) return operation.result;
  if (operation.status !== 'in_progress' || operation.idempotency_key !== idempotencyKey) {
    throw new ProvisioningError(409, 'This provisioning request is already being processed or requires administrator reconciliation. Do not submit it with a new request key.', 'provisioning_operation_conflict');
  }
  if (operation.created === false) {
    throw new ProvisioningError(409, 'This provisioning request already exists. Its status must be checked before retrying.', 'provisioning_operation_conflict');
  }

  let createdUserId = null;
  try {
    await repository.updateProvisioningOperation(operation.id, { current_step: 'inviting_auth_user' });
    const invitation = await authAdmin.inviteUserByEmail(request.email, {
      data: {
        display_name: request.displayName,
        preferred_language: request.preferredLanguage
      },
      redirectTo: appOrigin.replace(/\/+$/, '') + '/set-password.html'
    });
    const user = invitation && invitation.user ? invitation.user : invitation;
    createdUserId = user && user.id;
    if (!createdUserId) {
      throw new ProvisioningError(502, 'Auth did not return the invited user ID.', 'invite_user_missing_id');
    }
    // Persist the Auth identity immediately. If execution stops after this
    // point, a reconciler can locate the exact invited account safely.
    await repository.updateProvisioningOperation(operation.id, {
      current_step: 'auth_user_created',
      auth_user_id: createdUserId
    });

    if (request.role === 'worker') {
      await repository.insertWorker({
        auth_user_id: createdUserId,
        facility_id: request.facilityIds[0],
        display_name: request.displayName,
        preferred_language: request.preferredLanguage,
        role: 'worker',
        is_active: true,
        consent_at: now().toISOString()
      });
    }

    if (request.facilityIds.length) {
      await repository.insertFacilityAssignments(request.facilityIds.map(facilityId => ({
        user_id: createdUserId,
        facility_id: facilityId,
        assignment_role: request.role,
        is_active: true
      })));
    }

    if (request.role === 'district_admin' || request.role === 'state_admin') {
      await repository.insertScopeAssignment({
        user_id: createdUserId,
        scope_level: request.scope.level,
        state_lgd_code: request.scope.stateLgdCode,
        district_lgd_code: request.role === 'district_admin' ? request.scope.districtLgdCode : null,
        block_lgd_code: null,
        scope_role: request.role,
        is_active: true
      });
    }

    // Keep the Auth-triggered profile pending while its role-specific
    // records and assignments are being created. Activate only after every
    // required relationship exists, so a partially provisioned invite can
    // never become an active operational account.
    await repository.updateProvisioningOperation(operation.id, {
      current_step: 'assignments_created',
      auth_user_id: createdUserId
    });
    await repository.activateProfile(createdUserId, {
      display_name: request.displayName,
      preferred_language: request.preferredLanguage,
      role: request.role,
      status: 'active'
    });

    const result = {
      userId: createdUserId,
      email: request.email,
      displayName: request.displayName,
      role: request.role,
      facilityIds: request.facilityIds,
      scope: request.scope,
      status: 'invited'
    };
    await repository.insertAuditLog({
      actor_worker_id: null,
      action: 'user_provisioned',
      entity_type: 'profile',
      entity_id: createdUserId,
      metadata: {
        provisioned_by: callerProfile.id,
        email: request.email,
        role: request.role,
        facility_ids: request.facilityIds,
        scope: request.scope,
        invitation_method: 'email_invite'
      }
    });

    await repository.updateProvisioningOperation(operation.id, {
      status: 'completed',
      current_step: 'completed',
      auth_user_id: createdUserId,
      result,
      completed_at: now().toISOString()
    });
    return result;
  } catch (error) {
    if (createdUserId) {
      const rollback = await Promise.allSettled([
        repository.suspendProfile(createdUserId),
        repository.rollbackAssignments(createdUserId)
      ]);
      let deleteFailed = false;
      try { await authAdmin.deleteUser(createdUserId); }
      catch { deleteFailed = true; }
      if (rollback.some(result => result.status === 'rejected') || deleteFailed) {
        await repository.updateProvisioningOperation(operation.id, {
          status: 'reconciliation_required',
          current_step: 'rollback_incomplete',
          auth_user_id: createdUserId,
          error_code: 'provisioning_rollback_incomplete',
          failure_detail: 'Automatic rollback was incomplete.'
        });
        throw new ProvisioningError(
          500,
          'Provisioning failed and automatic rollback was incomplete. A platform administrator must reconcile the suspended account and its assignments.',
          'provisioning_rollback_incomplete'
        );
      }
    }
    if (!(error instanceof ProvisioningError && error.code === 'provisioning_rollback_incomplete')) {
      await repository.updateProvisioningOperation(operation.id, {
        status: 'failed',
        current_step: 'failed',
        auth_user_id: createdUserId,
        error_code: error.code || 'provisioning_failed',
        failure_detail: 'Provisioning failed; automatic cleanup was attempted.'
      });
    }
    if (error instanceof ProvisioningError) throw error;
    throw new ProvisioningError(
      500,
      'The invitation could not be completed. No active account was provisioned.',
      'provisioning_failed'
    );
  }
}
