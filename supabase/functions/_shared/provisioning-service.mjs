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

  let createdUserId = null;
  try {
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

    await repository.activateProfile(createdUserId, {
      display_name: request.displayName,
      preferred_language: request.preferredLanguage,
      role: request.role,
      status: 'active'
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

    return {
      userId: createdUserId,
      email: request.email,
      displayName: request.displayName,
      role: request.role,
      facilityIds: request.facilityIds,
      scope: request.scope,
      status: 'invited'
    };
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
        throw new ProvisioningError(
          500,
          'Provisioning failed and automatic rollback was incomplete. A platform administrator must reconcile the suspended account and its assignments.',
          'provisioning_rollback_incomplete'
        );
      }
    }
    if (error instanceof ProvisioningError) throw error;
    throw new ProvisioningError(
      500,
      'The invitation could not be completed. No active account was provisioned.',
      'provisioning_failed'
    );
  }
}
