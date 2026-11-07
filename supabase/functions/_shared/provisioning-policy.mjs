export const CHHATTISGARH_STATE_LGD_CODE = '22';

export const PROVISIONABLE_ROLES = Object.freeze([
  'worker', 'supervisor', 'district_admin', 'state_admin'
]);

export const PROVISIONING_HIERARCHY = Object.freeze({
  platform_admin: PROVISIONABLE_ROLES,
  state_admin: ['worker', 'supervisor', 'district_admin'],
  district_admin: ['worker', 'supervisor']
});

const LANGUAGES = new Set(['en', 'hi', 'ta', 'te', 'bn', 'mr']);

export class ProvisioningError extends Error {
  constructor(status, message, code = 'provisioning_error') {
    super(message);
    this.name = 'ProvisioningError';
    this.status = status;
    this.code = code;
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function validateProvisioningInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ProvisioningError(400, 'A JSON provisioning request is required.', 'invalid_body');
  }

  const email = String(input.email || '').trim().toLowerCase();
  const displayName = String(input.displayName || '').trim().replace(/\s+/g, ' ');
  const role = String(input.role || '').trim();
  const preferredLanguage = String(input.preferredLanguage || 'hi').trim();
  const facilityIds = Array.isArray(input.facilityIds)
    ? [...new Set(input.facilityIds.map(value => String(value).trim()))]
    : [];
  const scope = input.scope && typeof input.scope === 'object' && !Array.isArray(input.scope)
    ? {
        level: String(input.scope.level || ''),
        stateLgdCode: String(input.scope.stateLgdCode || ''),
        districtLgdCode: String(input.scope.districtLgdCode || '')
      }
    : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new ProvisioningError(400, 'Enter a valid work email address.', 'invalid_email');
  }
  if (displayName.length < 2 || displayName.length > 100) {
    throw new ProvisioningError(400, 'Display name must be between 2 and 100 characters.', 'invalid_display_name');
  }
  if (!PROVISIONABLE_ROLES.includes(role)) {
    throw new ProvisioningError(400, 'The requested role cannot be provisioned through this workflow.', 'invalid_role');
  }
  if (!LANGUAGES.has(preferredLanguage)) {
    throw new ProvisioningError(400, 'Choose a supported BUSHO language.', 'invalid_language');
  }

  if (['worker', 'supervisor'].includes(role)) {
    if (scope) throw new ProvisioningError(400, 'Facility-based roles cannot include an administrative scope.', 'unexpected_scope');
    if (facilityIds.length < 1 || facilityIds.length > 20 || facilityIds.some(id => !isUuid(id))) {
      throw new ProvisioningError(400, 'Select between 1 and 20 valid facility records.', 'invalid_facilities');
    }
    if (role === 'worker' && facilityIds.length !== 1) {
      throw new ProvisioningError(400, 'A health worker must be assigned to exactly one facility.', 'worker_facility_count');
    }
    if (role === 'worker' && input.consentConfirmed !== true) {
      throw new ProvisioningError(400, 'Worker data-processing consent must be confirmed before provisioning.', 'worker_consent_required');
    }
  } else {
    if (facilityIds.length) {
      throw new ProvisioningError(400, 'District and state administrators receive geographic scope, not facility assignments.', 'unexpected_facilities');
    }
    if (!scope || scope.stateLgdCode !== CHHATTISGARH_STATE_LGD_CODE) {
      throw new ProvisioningError(400, 'A valid Chhattisgarh administrative scope is required.', 'invalid_scope');
    }
    if (role === 'district_admin' && (scope.level !== 'district' || !/^\d{1,8}$/.test(scope.districtLgdCode))) {
      throw new ProvisioningError(400, 'A district administrator requires one valid district LGD code.', 'invalid_district_scope');
    }
    if (role === 'state_admin' && (scope.level !== 'state' || scope.districtLgdCode)) {
      throw new ProvisioningError(400, 'A state administrator must be assigned the Chhattisgarh state scope.', 'invalid_state_scope');
    }
  }

  return Object.freeze({
    email,
    displayName,
    role,
    preferredLanguage,
    facilityIds,
    scope,
    consentConfirmed: input.consentConfirmed === true
  });
}

export function assertCanProvision(callerProfile, callerScopes, request, now = new Date()) {
  if (!callerProfile || callerProfile.status !== 'active') {
    throw new ProvisioningError(403, 'An active administrator account is required.', 'inactive_provisioner');
  }
  const permitted = PROVISIONING_HIERARCHY[callerProfile.role] || [];
  if (!permitted.includes(request.role)) {
    throw new ProvisioningError(403, 'Your administrator role cannot provision the requested role.', 'role_hierarchy_denied');
  }

  const timestamp = new Date(now).getTime();
  const scopes = (Array.isArray(callerScopes) ? callerScopes : []).filter(scope => {
    if (!scope || scope.is_active !== true) return false;
    const validFrom = scope.valid_from ? new Date(scope.valid_from).getTime() : 0;
    const validUntil = scope.valid_until ? new Date(scope.valid_until).getTime() : Infinity;
    return validFrom <= timestamp && validUntil > timestamp;
  });

  if (callerProfile.role === 'state_admin' &&
      !scopes.some(scope => scope.scope_level === 'state' && scope.scope_role === 'state_admin' &&
        scope.state_lgd_code === CHHATTISGARH_STATE_LGD_CODE)) {
    throw new ProvisioningError(403, 'Your account has no active Chhattisgarh state scope.', 'missing_state_scope');
  }
  if (callerProfile.role === 'district_admin' &&
      !scopes.some(scope => scope.scope_level === 'district' && scope.scope_role === 'district_admin' &&
        scope.state_lgd_code === CHHATTISGARH_STATE_LGD_CODE && scope.district_lgd_code)) {
    throw new ProvisioningError(403, 'Your account has no active district scope.', 'missing_district_scope');
  }

  if (request.role === 'state_admin' && callerProfile.role !== 'platform_admin') {
    throw new ProvisioningError(403, 'Only a platform administrator can provision a state administrator.', 'state_admin_hierarchy_denied');
  }
  if (request.role === 'district_admin' && !['platform_admin','state_admin'].includes(callerProfile.role)) {
    throw new ProvisioningError(403, 'Only a state or platform administrator can provision a district administrator.', 'district_admin_hierarchy_denied');
  }

  return scopes;
}

export function assertFacilityAssignmentsAllowed(callerProfile, callerScopes, facilities) {
  if (!Array.isArray(facilities) || facilities.length === 0) {
    throw new ProvisioningError(422, 'No verified facilities were found for this assignment.', 'facilities_unavailable');
  }
  for (const facility of facilities) {
    if (!facility || facility.is_active !== true || facility.is_synthetic !== false ||
        facility.verification_status !== 'verified' ||
        facility.state_lgd_code !== CHHATTISGARH_STATE_LGD_CODE) {
      throw new ProvisioningError(422, 'Only active, verified, non-synthetic Chhattisgarh facilities can receive assignments.', 'facility_not_assignable');
    }
  }
  if (callerProfile.role === 'state_admin' &&
      facilities.some(facility => !callerScopes.some(scope =>
        scope.scope_level === 'state' && scope.state_lgd_code === facility.state_lgd_code))) {
    throw new ProvisioningError(403, 'One or more facilities are outside your state scope.', 'facility_scope_denied');
  }
  if (callerProfile.role === 'district_admin' &&
      facilities.some(facility => !callerScopes.some(scope =>
        scope.scope_level === 'district' &&
        scope.state_lgd_code === facility.state_lgd_code &&
        scope.district_lgd_code === facility.district_lgd_code))) {
    throw new ProvisioningError(403, 'One or more facilities are outside your district scope.', 'facility_scope_denied');
  }
  return true;
}

export function assertDistrictAssignmentAllowed(callerProfile, callerScopes, district) {
  if (!district || district.state_lgd_code !== CHHATTISGARH_STATE_LGD_CODE) {
    throw new ProvisioningError(422, 'The selected district is not in the Chhattisgarh administrative directory.', 'district_not_found');
  }
  if (callerProfile.role === 'state_admin' &&
      !callerScopes.some(scope => scope.scope_level === 'state' &&
        scope.state_lgd_code === district.state_lgd_code)) {
    throw new ProvisioningError(403, 'The selected district is outside your state scope.', 'district_scope_denied');
  }
  if (callerProfile.role === 'district_admin') {
    throw new ProvisioningError(403, 'District administrators cannot provision another district administrator.', 'district_admin_hierarchy_denied');
  }
  return true;
}
