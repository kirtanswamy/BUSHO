(() => {
  const root = document.querySelector('[data-portal-role="admin"]');
  if (!root) return;

  const roleSelect = document.getElementById('provision-role');
  const facilitySection = document.getElementById('facility-section');
  const facilityOptions = document.getElementById('facility-options');
  const facilityHelp = document.getElementById('facility-help');
  const districtSection = document.getElementById('district-section');
  const districtSelect = document.getElementById('provision-district');
  const consentSection = document.getElementById('consent-section');
  const consent = document.getElementById('provision-consent');
  const form = document.getElementById('provision-form');
  const submit = document.getElementById('provision-submit');
  const status = document.getElementById('provision-status');
  const readiness = document.getElementById('facility-readiness');
  const readinessDetail = document.getElementById('facility-readiness-detail');

  let client = null;
  let profile = null;
  let facilities = [];
  let districts = [];
  let busy = false;

  const ROLE_LABELS = {
    worker: 'Health worker',
    supervisor: 'Facility supervisor',
    district_admin: 'District administrator',
    state_admin: 'State administrator'
  };

  function showStatus(message, kind = '') {
    status.textContent = message;
    status.className = 'admin-status' + (kind ? ' ' + kind : '');
  }

  function allowedRoles(role) {
    if (role === 'platform_admin') return ['state_admin','district_admin','supervisor','worker'];
    if (role === 'state_admin') return ['district_admin','supervisor','worker'];
    if (role === 'district_admin') return ['supervisor','worker'];
    return [];
  }

  function selectedFacilityIds() {
    return [...facilityOptions.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
  }

  function renderFacilityOptions() {
    facilityOptions.replaceChildren();
    if (!facilities.length) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.textContent = 'No verified, active, non-synthetic facilities are currently available in your authorised scope. Facility-based accounts cannot be invited until the facility directory is verified and populated.';
      facilityOptions.append(empty);
      facilityHelp.textContent = 'No assignable facilities found.';
      return;
    }
    facilities.forEach(facility => {
      const label = document.createElement('label');
      label.className = 'admin-facility-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = facility.id;
      input.addEventListener('change', updateRoleSections);
      const copy = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = facility.name || 'Unnamed verified facility';
      const meta = document.createElement('small');
      const district = districts.find(item => item.lgd_code === facility.district_lgd_code);
      meta.textContent = [district?.name || ('District LGD ' + facility.district_lgd_code), facility.block_lgd_code ? ('Block LGD ' + facility.block_lgd_code) : 'Block not mapped'].join(' · ');
      copy.append(name, meta);
      label.append(input, copy);
      facilityOptions.append(label);
    });
    facilityHelp.textContent = 'Workers must have exactly one facility. Supervisors may be assigned to one or more facilities (maximum 20).';
  }

  function renderDistrictOptions() {
    districtSelect.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a district';
    districtSelect.append(placeholder);
    districts.forEach(district => {
      const option = document.createElement('option');
      option.value = district.lgd_code;
      option.textContent = district.name + ' · LGD ' + district.lgd_code;
      districtSelect.append(option);
    });
  }

  function updateRoleSections() {
    const role = roleSelect.value;
    const facilityRole = role === 'worker' || role === 'supervisor';
    const districtRole = role === 'district_admin';
    const stateRole = role === 'state_admin';
    facilitySection.classList.toggle('hidden', !facilityRole);
    districtSection.classList.toggle('hidden', !districtRole);
    consentSection.classList.toggle('hidden', role !== 'worker');
    consent.required = role === 'worker';

    const selected = selectedFacilityIds();
    facilityOptions.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.disabled = role === 'worker' && selected.length === 1 && !input.checked;
      if (role === 'worker' && input.checked) {
        facilityOptions.querySelectorAll('input[type="checkbox"]').forEach(other => {
          if (other !== input) other.checked = false;
        });
      }
    });
    if (stateRole) showStatus('State scope will be assigned to Chhattisgarh (LGD 22).');
    else if (role !== 'worker' && role !== 'supervisor' && !districtRole) showStatus('');
    else if (facilityRole && !facilities.length) showStatus('Facility-based invitations are blocked until verified facilities are available.', 'error');
    else if (districtRole && !districts.length) showStatus('No district directory records are available for this administrator.', 'error');
    else showStatus('');
  }

  function renderRoleOptions() {
    roleSelect.replaceChildren();
    allowedRoles(profile.role).forEach(role => {
      const option = document.createElement('option');
      option.value = role;
      option.textContent = ROLE_LABELS[role];
      if (['worker','supervisor'].includes(role) && !facilities.length) option.disabled = true;
      if (role === 'district_admin' && !districts.length) option.disabled = true;
      roleSelect.append(option);
    });
    if (!roleSelect.options.length) {
      const option = document.createElement('option');
      option.textContent = 'No provisioning permissions';
      option.value = '';
      option.disabled = true;
      roleSelect.append(option);
    }
    updateRoleSections();
  }

  async function loadOptions() {
    readiness.textContent = 'Loading authorised facility directory…';
    readinessDetail.textContent = 'Only active, verified, non-synthetic facilities are eligible.';
    try {
      const result = await client.listProvisioningOptions();
      facilities = result.facilities || [];
      districts = result.districts || [];
      renderFacilityOptions();
      renderDistrictOptions();
      readiness.textContent = facilities.length + ' verified facilities available in this account scope';
      readinessDetail.textContent = facilities.length
        ? 'Facility assignment is restricted to the facilities returned by your authenticated scope.'
        : 'The current project has no verified facility records. Provisioning workers and supervisors is intentionally disabled until real facility records are verified and assigned.';
      renderRoleOptions();
    } catch (error) {
      facilities = [];
      districts = [];
      renderFacilityOptions();
      renderDistrictOptions();
      readiness.textContent = 'Facility directory unavailable';
      readinessDetail.textContent = error.message || 'Could not load authorised facility records.';
      renderRoleOptions();
    }
  }

  async function onAuthenticated(event) {
    profile = event.detail?.profile || null;
    if (!profile || !['platform_admin','state_admin','district_admin'].includes(profile.role)) return;
    try {
      const factory = window.BUSHO_SUPABASE_CLIENT;
      const config = window.BUSHO_SUPABASE_CONFIG;
      if (!factory || !config) throw new Error('Secure BUSHO configuration is unavailable.');
      client = factory.createClient(config);
      document.getElementById('admin-role-chip').textContent =
        (profile.display_name || 'Administrator') + ' · ' + profile.role.replaceAll('_',' ');
      await loadOptions();
    } catch (error) {
      showStatus(error.message || 'Unable to initialise provisioning.', 'error');
    }
  }

  roleSelect.addEventListener('change', updateRoleSections);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !client || !profile) return;
    const role = roleSelect.value;
    const facilityIds = selectedFacilityIds();
    if (['worker','supervisor'].includes(role)) {
      if (!facilities.length) return showStatus('No verified facility is available. No account was created.', 'error');
      if (role === 'worker' && facilityIds.length !== 1) return showStatus('Select exactly one facility for a health worker.', 'error');
      if (role === 'supervisor' && (facilityIds.length < 1 || facilityIds.length > 20)) return showStatus('Select between 1 and 20 facilities for a supervisor.', 'error');
    }
    if (role === 'district_admin' && !districtSelect.value) return showStatus('Select the district for this administrator.', 'error');
    if (role === 'worker' && !consent.checked) return showStatus('Confirm that the worker has been informed and consented before sending an invitation.', 'error');

    const input = {
      email: document.getElementById('provision-email').value,
      displayName: document.getElementById('provision-name').value,
      preferredLanguage: document.getElementById('provision-language').value,
      role,
      facilityIds,
      consentConfirmed: role === 'worker' && consent.checked
    };
    if (role === 'district_admin') {
      input.scope = { level: 'district', stateLgdCode: '22', districtLgdCode: districtSelect.value };
    } else if (role === 'state_admin') {
      input.scope = { level: 'state', stateLgdCode: '22', districtLgdCode: '' };
    }

    busy = true;
    submit.disabled = true;
    submit.textContent = 'Validating scope and sending invitation…';
    showStatus('The server is checking your role, scope, facility status and assignment permissions.');
    try {
      const result = await client.provisionUser(input);
      const invitation = result.invitation || {};
      form.reset();
      showStatus('Invitation created for ' + (invitation.email || input.email) + '. The recipient must set a password using the emailed link. Role and scope are now assigned by BUSHO.', 'success');
      updateRoleSections();
    } catch (error) {
      showStatus(error.message || 'The invitation could not be completed.', 'error');
    } finally {
      busy = false;
      submit.disabled = false;
      submit.textContent = 'Send secure invitation';
    }
  });

  document.addEventListener('busho:authenticated', onAuthenticated);
  document.addEventListener('busho:unauthenticated', () => {
    client = null;
    profile = null;
    facilities = [];
    districts = [];
    facilityOptions.replaceChildren();
    showStatus('');
  });
})();
