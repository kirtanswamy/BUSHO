(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BUSHO_PORTAL_AUTH_POLICY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function evaluateProfile(profile, allowedRoles) {
    if (!profile || typeof profile !== 'object' || !profile.id) {
      return { allowed: false, reason: 'profile_missing' };
    }
    if (profile.status !== 'active') {
      return { allowed: false, reason: 'account_not_active' };
    }
    if (!Array.isArray(allowedRoles) || !allowedRoles.includes(profile.role)) {
      return { allowed: false, reason: 'wrong_role' };
    }
    return { allowed: true, reason: null };
  }

  return Object.freeze({ evaluateProfile });
});
