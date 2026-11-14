(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BUSHO_SUPABASE_CLIENT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const SESSION_KEY = 'busho-auth-session-v1';
  const REVIEW_DECISIONS = new Set([
    'supervisor_verified', 'correction_requested', 'escalated', 'rejected', 'closed'
  ]);
  const ITEM_FIELDS = [
    'item_type', 'item_code', 'display_label', 'quantity', 'unit',
    'value_text', 'confidence', 'requires_review'
  ];

  function createClient(config) {
    config = config || {};
    const baseUrl = String(config.url || '').replace(/\/+$/, '');
    const publishableKey = String(config.publishableKey || '');
    const fetchImpl = config.fetch || (root && root.fetch ? root.fetch.bind(root) : null);
    const storage = config.storage || safeSessionStorage();
    const now = typeof config.now === 'function' ? config.now : () => Date.now();

    if (!/^https:\/\//i.test(baseUrl)) throw new Error('A valid Supabase HTTPS URL is required.');
    if (!publishableKey.startsWith('sb_publishable_')) {
      throw new Error('A publishable key starting with sb_publishable_ is required; legacy anon and service-role keys are not accepted.');
    }
    if (typeof fetchImpl !== 'function') throw new Error('Fetch is unavailable in this browser environment.');
    if (!storage) throw new Error('Session storage is unavailable; BUSHO cannot safely persist an Auth session.');

    function safeSessionStorage() {
      try { return root && root.sessionStorage ? root.sessionStorage : null; }
      catch { return null; }
    }

    function readSession() {
      try {
        const raw = storage.getItem(SESSION_KEY);
        if (!raw) return null;
        const value = JSON.parse(raw);
        if (!value || typeof value.access_token !== 'string' || !value.refresh_token || !value.user?.id) {
          storage.removeItem(SESSION_KEY);
          return null;
        }
        return value;
      } catch {
        try { storage.removeItem(SESSION_KEY); } catch {}
        return null;
      }
    }

    function writeSession(session) {
      if (!session || !session.access_token || !session.refresh_token || !session.user?.id) {
        throw new Error('Supabase returned an incomplete Auth session.');
      }
      const expiresAt = Number(session.expires_at)
        || Math.floor(now() / 1000) + Number(session.expires_in || 3600);
      storage.setItem(SESSION_KEY, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: expiresAt,
        user: session.user
      }));
      return readSession();
    }

    function clearSession() {
      try { storage.removeItem(SESSION_KEY); } catch {}
    }

    async function parseResponse(response) {
      if (response.status === 204) return null;
      let payload;
      const contentType = response.headers && response.headers.get
        ? response.headers.get('content-type') || '' : '';
      try {
        payload = contentType.includes('json') ? await response.json() : await response.text();
      } catch {
        payload = null;
      }
      if (!response.ok) {
        const message = payload && typeof payload === 'object'
          ? (payload.msg || payload.message || payload.error_description || payload.error || 'Supabase request failed.')
          : (payload || 'Supabase request failed.');
        const error = new Error(String(message));
        error.status = response.status;
        error.code = payload && typeof payload === 'object' ? payload.code : undefined;
        throw error;
      }
      return payload;
    }

    async function authRequest(path, options) {
      options = options || {};
      const headers = {
        apikey: publishableKey,
        'Content-Type': 'application/json',
        ...(options.accessToken ? { Authorization: 'Bearer ' + options.accessToken } : {}),
        ...(options.headers || {})
      };
      const response = await fetchImpl(baseUrl + '/auth/v1/' + path, {
        method: options.method || 'POST',
        headers,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
      });
      return parseResponse(response);
    }

    // Multiple portal actions can discover an expired session at the same
    // time. Supabase rotates refresh tokens, so concurrent refresh requests
    // using the same token can invalidate one another. Share one refresh
    // promise across all requests made by this client instance.
    let refreshInFlight = null;

    async function refreshSession(session) {
      if (refreshInFlight) return refreshInFlight;
      if (!session || !session.refresh_token) {
        clearSession();
        throw new Error('Your BUSHO session has expired. Sign in again.');
      }
      refreshInFlight = (async () => {
        try {
          const result = await authRequest('token?grant_type=refresh_token', {
            method: 'POST',
            body: { refresh_token: session.refresh_token }
          });
          return writeSession(result);
        } catch (error) {
          clearSession();
          throw error;
        } finally {
          refreshInFlight = null;
        }
      })();
      return refreshInFlight;
    }

    async function getValidSession() {
      const session = readSession();
      if (!session) throw new Error('Sign in to BUSHO before accessing operational records.');
      const expiresAt = Number(session.expires_at || 0);
      if (expiresAt <= Math.floor(now() / 1000) + 60) return refreshSession(session);
      return session;
    }

    async function restRequest(resource, options) {
      options = options || {};
      const session = await getValidSession();
      const headers = {
        apikey: publishableKey,
        Authorization: 'Bearer ' + session.access_token,
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.prefer ? { Prefer: options.prefer } : {}),
        ...(options.headers || {})
      };
      const response = await fetchImpl(baseUrl + '/rest/v1/' + resource, {
        method: options.method || 'GET',
        headers,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
      });
      return parseResponse(response);
    }

    async function signInWithPassword(credentials) {
      credentials = credentials || {};
      const email = String(credentials.email || '').trim().toLowerCase();
      const password = String(credentials.password || '');
      if (!email || !password) throw new Error('Email and password are required.');
      const session = await authRequest('token?grant_type=password', {
        method: 'POST',
        body: { email, password }
      });
      writeSession(session);
      const profile = await getMyProfile();
      return {
        user: session.user,
        profile,
        canAccess: Boolean(profile && profile.status === 'active' && profile.role !== 'pending')
      };
    }

    async function signUpWithPassword(details) {
      details = details || {};
      const email = String(details.email || '').trim().toLowerCase();
      const password = String(details.password || '');
      if (!email || !password) throw new Error('Email and password are required.');
      const result = await authRequest('signup', {
        method: 'POST',
        body: {
          email,
          password,
          data: {
            full_name: String(details.displayName || '').trim(),
            preferred_language: String(details.preferredLanguage || 'hi')
          }
        }
      });
      if (result && result.access_token) writeSession(result);
      return result;
    }

    async function setSessionFromUrlHash(hash) {
      const params = new URLSearchParams(String(hash || '').replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      if (!accessToken || !refreshToken || type !== 'invite') {
        throw new Error('This invitation link is missing, expired or not intended for account setup. Ask an administrator to send a new invitation.');
      }
      const user = await authRequest('user', { method: 'GET', accessToken });
      if (!user || !user.id) throw new Error('Supabase could not verify the invitation session.');
      const session = writeSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: Number(params.get('expires_in') || 3600),
        token_type: params.get('token_type') || 'bearer',
        user
      });
      return { session, type };
    }

    async function updatePassword(password) {
      const value = String(password || '');
      if (value.length < 12 || value.length > 128) {
        throw new Error('Choose a password between 12 and 128 characters.');
      }
      const session = await getValidSession();
      return authRequest('user', {
        method: 'PUT',
        accessToken: session.access_token,
        body: { password: value }
      });
    }

    async function signOut() {
      const session = readSession();
      try {
        if (session && session.access_token) {
          await authRequest('logout', { method: 'POST', accessToken: session.access_token });
        }
      } catch {
        // Local sign-out must still clear a session when the network is unavailable.
      } finally {
        clearSession();
      }
    }

    async function getMyProfile() {
      const session = await getValidSession();
      const rows = await restRequest(
        'profiles?id=eq.' + encodeURIComponent(session.user.id) +
        '&select=id,display_name,preferred_language,role,status,created_at,updated_at'
      );
      return Array.isArray(rows) ? (rows[0] || null) : null;
    }

    async function requireActiveProfile(allowedRoles) {
      const profile = await getMyProfile();
      if (!profile || profile.status !== 'active' || profile.role === 'pending') {
        throw new Error('Your BUSHO account is pending approval. Ask an authorised administrator to activate it.');
      }
      if (allowedRoles && !allowedRoles.includes(profile.role)) {
        throw new Error('This action is not available to the ' + profile.role + ' role.');
      }
      return profile;
    }

    async function getMyWorker() {
      const session = await getValidSession();
      const rows = await restRequest(
        'workers?auth_user_id=eq.' + encodeURIComponent(session.user.id) +
        '&is_active=eq.true&select=id,auth_user_id,facility_id,display_name,preferred_language,role,is_active,facilities(name,district,block_lgd_code)'
      );
      return Array.isArray(rows) ? (rows[0] || null) : null;
    }

    async function getMyStockoutContext() {
      await requireActiveProfile(['worker']);
      const worker = await getMyWorker();
      if (!worker) throw new Error('No active worker record is linked to this Auth account.');
      const links = await restRequest(
        'facility_service_links?select=id,shc_facility_id,phc_facility_id,verification_status,effective_from,effective_until,data_mode&shc_facility_id=eq.' +
        encodeURIComponent(worker.facility_id) + '&verification_status=eq.verified&order=effective_from.desc'
      );
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now()));
      const current = (Array.isArray(links) ? links : []).filter(link =>
        (!link.effective_from || link.effective_from <= today) &&
        (!link.effective_until || link.effective_until >= today)
      );
      if (current.length > 1) {
        throw new Error('More than one current SHC-to-PHC relationship is verified. Ask the facility registry administrator to resolve the mapping.');
      }
      let phc = null;
      if (current[0]) {
        const rows = await restRequest(
          'facilities?id=eq.' + encodeURIComponent(current[0].phc_facility_id) +
          '&select=id,name,district,facility_type,is_synthetic'
        );
        phc = Array.isArray(rows) ? (rows[0] || null) : null;
      }
      return { worker, link: current[0] || null, phc };
    }

    async function listMyStockoutCases() {
      await requireActiveProfile(['worker']);
      return restRequest(
        'stockout_cases?select=*,stockout_case_events(*)&order=created_at.desc'
      );
    }

    async function createStockoutCase(input) {
      input = input || {};
      await requireActiveProfile(['worker']);
      const context = await getMyStockoutContext();
      if (!context.link || !context.phc) {
        throw new Error('No current verified parent PHC is linked to your assigned SHC. Contact the facility registry administrator; BUSHO will not guess the PHC.');
      }
      const medicineName = String(input.medicineName || '').trim();
      const unit = String(input.quantityUnit || '').trim();
      const requested = Number(input.requestedQuantity);
      const reported = Number(input.reportedQuantity);
      if (!medicineName || !unit || !Number.isFinite(requested) || requested <= 0 ||
          !Number.isFinite(reported) || reported < 0) {
        throw new Error('Enter a medicine name, a non-negative observed quantity, a positive requested quantity and a unit.');
      }
      const rows = await restRequest('stockout_cases', {
        method: 'POST',
        body: {
          shc_facility_id: context.worker.facility_id,
          phc_facility_id: context.phc.id,
          submitted_by_worker_id: context.worker.id,
          medicine_name: medicineName,
          medicine_source_reference: String(input.medicineSourceReference || '').trim() || null,
          reported_quantity: reported,
          requested_quantity: requested,
          quantity_unit: unit,
          observation_source: input.observationSource || 'physical_count',
          observed_at: input.observedAt || new Date(now()).toISOString(),
          worker_note: String(input.note || '').trim() || null,
          status: 'submitted_to_phc',
          data_mode: context.link.data_mode
        },
        prefer: 'return=representation'
      });
      return Array.isArray(rows) ? (rows[0] || null) : rows;
    }

    async function transitionMyStockoutCase(input) {
      input = input || {};
      if (!input.id || !input.status) throw new Error('Stockout case ID and next status are required.');
      await requireActiveProfile(['worker']);
      const allowed = new Set(['resubmitted','collected_by_shc','partially_received_at_shc','received_at_shc']);
      if (!allowed.has(input.status)) throw new Error('This transition is not available to the SHC worker.');
      const fields = ['status','worker_note','shc_collection_reference','shc_collected_at','shc_received_quantity','shc_receipt_reference','shc_received_at','discrepancy_note'];
      const payload = {};
      for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(input, field)) payload[field] = input[field];
      }
      const rows = await restRequest(
        'stockout_cases?id=eq.' + encodeURIComponent(input.id),
        { method: 'PATCH', body: payload, prefer: 'return=representation' }
      );
      const updated = Array.isArray(rows) ? (rows[0] || null) : rows;
      if (!updated) throw new Error('The stockout case was not updated. Check its current status and your SHC assignment.');
      return updated;
    }

    async function listPHCStockoutCases() {
      await requireActiveProfile(['supervisor']);
      return restRequest(
        'stockout_cases?select=*,stockout_case_events(*)&order=created_at.desc'
      );
    }

    async function reviewPHCStockoutCase(input) {
      input = input || {};
      await requireActiveProfile(['supervisor']);
      if (!input.id) throw new Error('Stockout case ID is required.');
      const allowed = new Set(['acknowledged_by_phc','under_phc_review','clarification_requested','accepted_for_phc_action','phc_cannot_fulfil']);
      if (!allowed.has(input.status)) throw new Error('This action is not available to the PHC supervisor.');
      const note = String(input.note || '').trim();
      if (['clarification_requested','phc_cannot_fulfil'].includes(input.status) && !note) {
        throw new Error('A reason is required for clarification or PHC non-fulfilment.');
      }
      const payload = { status: input.status };
      if (note) payload.phc_review_note = note;
      if (input.availableQuantity !== undefined && input.availableQuantity !== null && input.availableQuantity !== '') {
        const quantity = Number(input.availableQuantity);
        if (!Number.isFinite(quantity) || quantity < 0) throw new Error('PHC observed available quantity must be zero or greater.');
        payload.phc_available_quantity = quantity;
      }
      if (input.status === 'accepted_for_phc_action' &&
          (payload.phc_available_quantity === undefined || payload.phc_available_quantity <= 0)) {
        throw new Error('Record a positive PHC quantity observed as available before accepting for PHC action.');
      }
      if (input.status === 'phc_cannot_fulfil') payload.phc_available_quantity = 0;
      const rows = await restRequest(
        'stockout_cases?id=eq.' + encodeURIComponent(input.id),
        { method: 'PATCH', body: payload, prefer: 'return=representation' }
      );
      const updated = Array.isArray(rows) ? (rows[0] || null) : rows;
      if (!updated) throw new Error('The case was not updated. It may be outside your PHC assignment or no longer in a reviewable state.');
      return updated;
    }

    async function listMyReports() {
      await requireActiveProfile(['worker']);
      return restRequest(
        'reports?select=*,report_items(*),report_events(*),facilities(name,district,block_lgd_code)&order=created_at.desc'
      );
    }

    async function getReport(reportId) {
      const rows = await restRequest(
        'reports?id=eq.' + encodeURIComponent(reportId) +
        '&select=*,report_items(*),report_events(*)'
      );
      return Array.isArray(rows) ? (rows[0] || null) : null;
    }

    async function createReportDraft(input) {
      input = input || {};
      await requireActiveProfile(['worker']);
      const worker = await getMyWorker();
      if (!worker) throw new Error('No active worker record is linked to this Auth account.');
      const requestedFacility = input.facilityId || worker.facility_id;
      if (requestedFacility !== worker.facility_id) {
        throw new Error('A worker can only submit reports for their assigned facility.');
      }
      const payload = {
        facility_id: worker.facility_id,
        worker_id: worker.id,
        original_text: String(input.originalText || '').trim(),
        language_code: String(input.languageCode || worker.preferred_language || 'en'),
        status: 'draft',
        summary: input.summary && typeof input.summary === 'object' ? input.summary : {}
      };
      if (!payload.original_text) throw new Error('A field report is required.');
      if (input.reportingDate) payload.reporting_date = input.reportingDate;
      const rows = await restRequest('reports', {
        method: 'POST',
        body: payload,
        prefer: 'return=representation'
      });
      return Array.isArray(rows) ? rows[0] : rows;
    }

    async function saveReportItems(reportId, items) {
      if (!reportId) throw new Error('Report ID is required.');
      if (!Array.isArray(items) || items.length === 0) return [];
      const payload = items.map(item => {
        const row = { report_id: reportId };
        for (const field of ITEM_FIELDS) {
          if (item && Object.prototype.hasOwnProperty.call(item, field)) row[field] = item[field];
        }
        if (!row.item_type || !row.display_label) {
          throw new Error('Each extracted field needs an item type and display label.');
        }
        return row;
      });
      return restRequest('report_items', {
        method: 'POST',
        body: payload,
        prefer: 'return=representation'
      });
    }

    async function updateReportDraft(reportId, input) {
      input = input || {};
      if (!reportId) throw new Error('Report ID is required.');
      const payload = {
        original_text: String(input.originalText || '').trim(),
        language_code: String(input.languageCode || 'en'),
        summary: input.summary && typeof input.summary === 'object' ? input.summary : {}
      };
      if (!payload.original_text) throw new Error('A field report is required.');
      if (input.reportingDate) payload.reporting_date = input.reportingDate;
      const rows = await restRequest(
        'reports?id=eq.' + encodeURIComponent(reportId),
        { method: 'PATCH', body: payload, prefer: 'return=representation' }
      );
      const updated = Array.isArray(rows) ? (rows[0] || null) : rows;
      if (!updated) throw new Error('The report draft could not be updated in your assigned scope.');
      return updated;
    }

    async function replaceReportItems(reportId, items) {
      if (!reportId) throw new Error('Report ID is required.');
      if (!Array.isArray(items)) throw new Error('Report items must be an array.');
      // A single report's structured fields are replaced as a set. This makes a retry
      // after a failed submission safe while the report remains an editable draft.
      await restRequest(
        'report_items?report_id=eq.' + encodeURIComponent(reportId),
        { method: 'DELETE' }
      );
      return saveReportItems(reportId, items);
    }

    async function submitReport(reportId) {
      const report = await getReport(reportId);
      if (!report) throw new Error('Report was not found in your assigned scope.');
      const nextStatus = report.status === 'draft' ? 'submitted'
        : report.status === 'correction_requested' ? 'resubmitted' : null;
      if (!nextStatus) throw new Error('This report is not ready for submission.');
      const rows = await restRequest(
        'reports?id=eq.' + encodeURIComponent(reportId),
        {
          method: 'PATCH',
          body: { status: nextStatus },
          prefer: 'return=representation'
        }
      );
      return Array.isArray(rows) ? (rows[0] || null) : rows;
    }

    async function listSupervisorReports() {
      await requireActiveProfile(['supervisor','district_admin','state_admin']);
      return restRequest(
        'reports?status=in.(submitted,resubmitted,supervisor_verified,correction_requested,escalated,rejected,closed)&select=*,report_items(*),report_events(*),workers(display_name,preferred_language),facilities(name,district,block_lgd_code)&order=created_at.desc'
      );
    }

    async function reviewReport(input) {
      input = input || {};
      await requireActiveProfile(['supervisor']);
      if (!input.reportId || !REVIEW_DECISIONS.has(input.decision)) {
        throw new Error('A report ID and valid supervisor decision are required.');
      }
      const note = String(input.note || '').trim();
      if (['correction_requested','escalated'].includes(input.decision) && !note) {
        throw new Error('A reason is required for a correction request or escalation.');
      }
      const payload = { status: input.decision };
      if (note) payload.review_note = note;
      if (input.summary && typeof input.summary === 'object') payload.summary = input.summary;
      const rows = await restRequest(
        'reports?id=eq.' + encodeURIComponent(input.reportId),
        { method: 'PATCH', body: payload, prefer: 'return=representation' }
      );
      return Array.isArray(rows) ? (rows[0] || null) : rows;
    }

    async function listReportEvents(reportId) {
      return restRequest(
        'report_events?report_id=eq.' + encodeURIComponent(reportId) + '&order=created_at.asc'
      );
    }

    async function listInventory() {
      return restRequest('inventory_items?is_active=eq.true&select=*,inventory_snapshots(*),inventory_movements(*)&order=name.asc');
    }

    async function createStockObservation(input) {
      input = input || {};
      await requireActiveProfile(['worker','storekeeper']);
      const worker = await getMyWorker();
      const quantity = Number(input.quantity);
      if (!input.inventoryItemId || !Number.isFinite(quantity) || quantity < 0) {
        throw new Error('An inventory item and a non-negative quantity are required.');
      }
      const payload = {
        inventory_item_id: input.inventoryItemId,
        quantity,
        observed_by: worker ? worker.id : null,
        source: input.source || (worker ? 'worker_report' : 'storekeeper_count'),
        data_mode: input.dataMode || 'synthetic_demo'
      };
      if (input.observedAt) payload.observed_at = input.observedAt;
      if (input.batchNumber) payload.batch_number = input.batchNumber;
      if (input.expiryDate) payload.expiry_date = input.expiryDate;
      if (input.notes) payload.notes = String(input.notes).slice(0, 500);
      const rows = await restRequest('inventory_snapshots', {
        method: 'POST', body: payload, prefer: 'return=representation'
      });
      return Array.isArray(rows) ? (rows[0] || null) : rows;
    }

    async function createReplenishmentRequest(input) {
      input = input || {};
      const profile = await requireActiveProfile(['supervisor']);
      const submissionKey = String(input.submissionKey || '').trim();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionKey)) {
        throw new Error('A valid recommendation submission key is required. Refresh the form and try again.');
      }
      const payload = {
        facility_id: input.facilityId,
        inventory_item_id: input.inventoryItemId,
        requested_quantity: Number(input.requestedQuantity),
        status: 'recommended_to_facility_store',
        source_report_id: input.sourceReportId,
        on_hand_quantity: Number(input.onHandQuantity),
        unit: String(input.unit || '').trim(),
        note: String(input.note || '').trim(),
        data_mode: input.dataMode || 'synthetic_demo',
        submission_key: submissionKey
      };
      if (!payload.facility_id || !payload.inventory_item_id || !payload.source_report_id ||
          !Number.isSafeInteger(payload.requested_quantity) || payload.requested_quantity <= 0 ||
          !Number.isSafeInteger(payload.on_hand_quantity) || payload.on_hand_quantity < 0 || !payload.unit) {
        throw new Error('Facility, verified source report, item, unit and valid quantities are required.');
      }
      try {
        const rows = await restRequest('replenishment_requests', {
          method: 'POST', body: payload, prefer: 'return=representation'
        });
        return Array.isArray(rows) ? (rows[0] || null) : rows;
      } catch (error) {
        if (error?.code !== '23505' && !/duplicate key|unique constraint/i.test(error?.message || '')) throw error;
        const existingRows = await restRequest(
          'replenishment_requests?select=id,facility_id,inventory_item_id,requested_quantity,source_report_id,on_hand_quantity,unit,note,data_mode,submission_key,created_by_user_id&created_by_user_id=eq.' +
          encodeURIComponent(profile.id) + '&submission_key=eq.' + encodeURIComponent(submissionKey)
        );
        const existing = Array.isArray(existingRows) ? existingRows[0] : null;
        if (!existing) throw error;
        const sameSubmission = existing.facility_id === payload.facility_id &&
          existing.inventory_item_id === payload.inventory_item_id &&
          Number(existing.requested_quantity) === payload.requested_quantity &&
          existing.source_report_id === payload.source_report_id &&
          Number(existing.on_hand_quantity) === payload.on_hand_quantity &&
          existing.unit === payload.unit && (existing.note || '') === payload.note &&
          existing.data_mode === payload.data_mode;
        if (!sameSubmission) {
          throw new Error('This submission key is already associated with different recommendation details. Start a new submission.');
        }
        return existing;
      }
    }

    async function listMyReplenishments() {
      return restRequest(
        'replenishment_requests?select=*,inventory_items(name,unit),replenishment_events(*),inventory_movements(*)&order=created_at.desc'
      );
    }

    async function transitionReplenishmentRequest(input) {
      input = input || {};
      if (!input.id || !input.status) throw new Error('Indent ID and next status are required.');
      await requireActiveProfile(['supervisor','storekeeper']);
      const allowedFields = {
        status: 'status',
        note: 'note',
        dpdmisReference: 'dpdmis_reference',
        allocationReference: 'allocation_reference',
        dispatchReference: 'dispatch_reference',
        receiptReference: 'receipt_reference',
        receivedQuantity: 'received_quantity'
      };
      const payload = {};
      for (const [camel, snake] of Object.entries(allowedFields)) {
        if (Object.prototype.hasOwnProperty.call(input, camel)) payload[snake] = input[camel];
      }
      const rows = await restRequest(
        'replenishment_requests?id=eq.' + encodeURIComponent(input.id),
        { method: 'PATCH', body: payload, prefer: 'return=representation' }
      );
      const updated = Array.isArray(rows) ? (rows[0] || null) : rows;
      if (!updated) {
        throw new Error('The request was not updated. It may be outside your facility scope or the workflow transition may not be permitted.');
      }
      return updated;
    }

    async function listProvisioningOptions() {
      const profile = await requireActiveProfile(['platform_admin','district_admin','state_admin']);
      const facilities = await restRequest(
        'facilities?select=id,name,district_lgd_code,block_lgd_code&state_lgd_code=eq.22&is_active=eq.true&is_synthetic=eq.false&verification_status=eq.verified&order=name.asc'
      );
      const districts = ['platform_admin','state_admin'].includes(profile.role)
        ? await restRequest('districts?select=lgd_code,name,state_lgd_code&state_lgd_code=eq.22&order=name.asc')
        : [];
      return { facilities: Array.isArray(facilities) ? facilities : [], districts: Array.isArray(districts) ? districts : [] };
    }

    async function provisionUser(input) {
      await requireActiveProfile(['platform_admin','district_admin','state_admin']);
      const session = await getValidSession();
      const response = await fetchImpl(baseUrl + '/functions/v1/provision-user', {
        method: 'POST',
        headers: {
          apikey: publishableKey,
          Authorization: 'Bearer ' + session.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input || {})
      });
      return parseResponse(response);
    }

    async function inspectProvisioningOperations() {
      await requireActiveProfile(['platform_admin']);
      const session = await getValidSession();
      const response = await fetchImpl(baseUrl + '/functions/v1/reconcile-provisioning', {
        method: 'GET',
        headers: {
          apikey: publishableKey,
          Authorization: 'Bearer ' + session.access_token
        }
      });
      return parseResponse(response);
    }

    async function manageFacilityRegistry(input) {
      await requireActiveProfile(['platform_admin','district_admin','state_admin']);
      const session = await getValidSession();
      const response = await fetchImpl(baseUrl + '/functions/v1/facility-registry', {
        method: 'POST',
        headers: {
          apikey: publishableKey,
          Authorization: 'Bearer ' + session.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input || {})
      });
      return parseResponse(response);
    }

    async function listDirectory() {
      const [states, districts, blocks] = await Promise.all([
        restRequest('states?select=*&order=name.asc'),
        restRequest('districts?select=*&order=name.asc'),
        restRequest('blocks?select=*&order=name.asc')
      ]);
      return { states, districts, blocks };
    }

    return Object.freeze({
      signInWithPassword,
      signUpWithPassword,
      setSessionFromUrlHash,
      updatePassword,
      signOut,
      getSession: () => readSession(),
      getMyProfile,
      requireActiveProfile,
      getMyWorker,
      listMyReports,
      getMyStockoutContext,
      listMyStockoutCases,
      listPHCStockoutCases,
      reviewPHCStockoutCase,
      createStockoutCase,
      transitionMyStockoutCase,
      getReport,
      createReportDraft,
      saveReportItems,
      updateReportDraft,
      replaceReportItems,
      submitReport,
      reviewReport,
      listSupervisorReports,
      listReportEvents,
      listInventory,
      createStockObservation,
      createReplenishmentRequest,
      listMyReplenishments,
      transitionReplenishmentRequest,
      listProvisioningOptions,
      provisionUser,
      inspectProvisioningOperations,
      manageFacilityRegistry,
      listDirectory
    });
  }

  return { createClient, sessionStorageKey: SESSION_KEY };
});
