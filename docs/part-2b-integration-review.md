# Part 2B Integration Review — 2026-11-07

## Scope
Read-only review of the canonical branch before connecting the worker and supervisor portals to the existing Supabase project. No production database rows, Auth users, migrations, or deployments were changed during this review.

## Verified current implementation

### Authentication
- `supabase-config.js` contains the public Supabase URL and a browser publishable key. No service-role key is present in the browser config.
- `supabase-client.js` implements password sign-in, session refresh, profile lookup, worker lookup, report CRUD helpers, report review, report events, inventory and replenishment methods.
- `role-auth.js` gates each portal using the Supabase profile role and active status. Signup is not exposed by these portal pages.
- Database profiles default to role/status `pending`; the browser cannot update role/status. This is the right baseline, but there is no administrator provisioning workflow in the portal.
- There are currently no linked Auth users, worker records or facility records in the live project, so a real worker cannot yet pass the full profile + worker-link check.

### Worker portal
- `app-v2.js` owns report extraction, editable structured fields, worker confirmation and report UI state.
- Its operational state is still saved under `busho-demo-state-v1` in browser localStorage.
- The confirm action only marks the browser state confirmed. It does not call `BUSHO_SUPABASE_CLIENT.createReportDraft`, `saveReportItems`, or `submitReport`.
- `portal-enhancements.js` independently writes a second synthetic record under `busho-demo-shared-reports-v1`. It creates a local cross-role bridge, not shared server persistence.
- These two stores can diverge: the extraction UI state and the supervisor bridge are separate records with separate IDs and different field representations.

### Supervisor portal
- `supervisor.html` still contains hard-coded demo metrics, facility coverage, workers, inventory and inbox rows.
- `portal-enhancements.js` reads the local synthetic report bridge, then mutates demo metrics and notification state in localStorage.
- The Supabase client has `listMyReports`, `reviewReport`, and event APIs, but the supervisor UI does not use them.
- Current demo data must not be presented as real facility activity.

### Database contract confirmed read-only
The live project schema has the expected report entities:
- `reports`: facility_id, worker_id, reporting_date, original_text, language_code, status, summary, review fields and timestamps.
- `report_items`: item_type, item_code, display_label, quantity, unit, value_text, confidence, requires_review.
- `report_events`: append-only actor/action/status/note/metadata timeline.
- `workers`: auth_user_id, facility_id, display_name, preferred_language, role and is_active.
- `facilities`: facility and geography references.
- `profiles`: Auth-linked role and account status.
- `user_facility_assignments`: role-scoped facility assignment.

The database has RLS and workflow guards. The application must rely on those server-side controls and must not treat client role checks as authorization.

## Risks to address before calling Part 2B complete
1. The current UI has two independent localStorage report stores; neither is authoritative.
2. The report-item conversion contract is not yet implemented between extraction rows and database columns.
3. Report creation, item insert and submission are separate REST requests. A failure between requests can leave a partial draft; the UI must retain the draft ID and support safe retry rather than silently duplicating records.
4. There is no real account provisioning path. A pending account cannot self-assign a role, worker row or facility. Provisioning must be administrator-controlled and server-side.
5. The current supervisor review client can patch report status, but UI actions and database constraints must be checked together before enabling review buttons.
6. Demo inventory, notifications, activities and KPI counts need explicit synthetic labels or honest empty states.

## Implementation sequence
- **2B.1:** Add a thin portal integration boundary that exposes authenticated profile/worker context and a safe report persistence workflow; keep the extraction engine intact. Add unit tests for item mapping, retry/idempotency behavior and event dispatch.
- **2B.2:** Wire worker draft save/submit/history to Supabase. Preserve the local draft on network failure; never claim a report was submitted until the server confirms it.
- **2B.3:** Replace supervisor synthetic inbox rows with RLS-scoped Supabase reports and report event timelines. Add verify/return/escalate actions only after reviewing exact transition rules.
- **2B.4:** Add an administrator-controlled provisioning workflow and test two roles across two facilities. No self-assigned privileges.
- **2B.5:** Remove or clearly isolate synthetic metrics and local demo notification bridges; add end-to-end tests and update docs.

## Acceptance criteria
- A worker can sign in only with an active worker profile and linked active worker/facility assignment.
- A worker can create, save, submit, reload and view their own report from the database.
- Original source text is preserved; structured extracted fields are stored separately and marked as requiring review where appropriate.
- A supervisor sees only reports within the RLS-authorised scope and can perform only permitted transitions.
- Report events survive refresh and provide an attributable timeline.
- Failed requests are visible and retryable; no false success state and no duplicate report creation on retry.
- No real patient-identifiable data is used in tests or demos.
- CI and a preview deployment pass; production remains unchanged until separately approved.

## Current checkpoint
- Canonical branch: `feature/chhattisgarh-operational-workflow`
- Existing draft PR: #5 (keep draft and unmerged while this milestone is in progress).
- No code or database mutations have been made as part of this review itself.
