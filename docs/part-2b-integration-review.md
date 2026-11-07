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

## Part 2B.1 implementation checkpoint — 2026-11-07

The first integration-boundary code has now been committed on the canonical feature branch:

- `report-persistence.js` maps the existing worker extraction tables into the actual database contract:
  - condition rows → `symptom_trend`
  - medicine rows → `stock_observation`
  - uncertain/worker-entered values remain `requires_review = true`; extraction confidence is not fabricated.
  - source phrases and extraction context are preserved in `value_text`; the original narrative remains in `reports.original_text`.
- `supabase-client.js` now has `updateReportDraft` and `replaceReportItems`.
- `replaceReportItems` uses delete-then-insert while the report remains an editable draft/correction. The live RLS policy explicitly limits worker item deletion/insertion to their own report in `draft` or `correction_requested`; this was checked read-only against the live project.
- The persistence coordinator requires a callback to save the returned report ID before item writes, resumes an existing report ID rather than creating a duplicate, updates the source narrative on correction, and does not return success unless the server confirms submission.
- Added unit tests for database mapping, validation, ordering, saved-ID checkpoint, correction resume, safe item replacement and failure paths.

**Important:** This is the tested persistence boundary, not yet a completed portal integration. The worker UI still needs to call it and show truthful pending/success/error states. Supervisor UI integration and live multi-user verification remain later parts. GitHub Actions/Vercel checks for the latest commit have not yet been confirmed green at this checkpoint.

## Part 2B.2 — worker portal connected to report persistence

The worker-side submit path is now connected to the persistence boundary:

- The worker page loads `report-persistence.js` before `app-v2.js`.
- `role-auth.js` emits authenticated/unauthenticated lifecycle events on `document`; the worker app loads and saves draft state under an Auth-user-specific local key, rather than the old shared demo key.
- Confirmation now calls the authenticated Supabase client, revalidates the worker profile, creates or resumes the same report draft, checkpoints the server report ID locally before writing structured items, and only shows success after server confirmation.
- A failed item write or submit preserves the same draft ID for retry. If the previous submit succeeded but the response was lost, a retry fetches the existing report and reconciles its server status instead of creating another report.
- The local recovery draft is removed after server submission; report narrative and extracted values are not retained in local storage after success.
- Logout is disabled while submission is in flight, and the submission callback checks that the same authenticated account is still active before writing the recovery checkpoint.
- The old worker-to-supervisor localStorage synthetic report bridge is disabled by default. Hard-coded worker activity counts/rows and the fictional Rampur facility label were removed from the worker portal.
- Worker confirmation/privacy copy was updated to say the report is submitted for supervisor review and to instruct workers not to enter patient-identifying information.

### Verification status
- CI run `42363981095` passed all three Node versions (18, 22, 24) and the PostgreSQL 17 database-contract job, including applying the migrations and running the RLS workflow contract. This run covered the worker integration code before the final language-copy-only commits.
- The Vercel preview deployment for the later language-copy commit reported success. This is a preview, not production.
- The full CI run for the checkpoint commit passed all three Node versions and the PostgreSQL 17 database-contract job: run `42364121713`. The Vercel preview status for the same checkpoint is successful. This verifies automated checks, not a live authenticated user journey.

### Remaining blockers
- The live Supabase project still has no Auth users, worker rows, facility rows or facility assignments. Therefore the UI code cannot yet be demonstrated with a real authorised worker account.
- Supervisor inbox/review UI remains synthetic and is not yet reading reports from Supabase.
- Worker report history, assigned-facility context, real notifications and facility-scoped metrics are not yet wired to server data.
- No admin provisioning workflow exists yet. Do not self-assign roles or seed live users/facilities without an approved provisioning process.

## Part 2B.3 — supervisor operations workspace implementation — 2026-11-07

### Data and authorization contract
- Re-checked the live foreign keys from `reports` to `workers` and `facilities`, and from `report_items` / `report_events` to `reports`.
- Re-checked the live RLS policies: supervisors can select reports only within assigned facility scope; report items and report events are readable through their parent report; worker writes are restricted to their own editable report.
- The authenticated client method `listSupervisorReports()` validates the server-controlled profile role and fetches report rows with structured items, events, worker display fields and facility display fields.
- The inbox query filters to submitted/reviewed states; unsubmitted drafts are not shown in the supervisor UI. Note: the underlying reports SELECT policy remains broader for assigned facility scope; if draft confidentiality is a strict policy requirement, tighten that RLS policy in a separately tested migration rather than relying on a UI filter.

### Implemented UI
- Added `supervisor-operations.js` and `supervisor-portal.js`.
- Dashboard KPIs are calculated from the returned scoped report set; no statewide totals or previous-period trend are inferred.
- Inbox supports search, status filters, refresh and report detail.
- Detail view displays original worker narrative, structured observations with source phrases and uncertainty, latest review note and database-generated audit events.
- Review decisions match the existing PostgreSQL transition guard: verify, request correction, escalate, reject, and close where permitted by current status. The database trigger and RLS policies remain authoritative.
- District/state admins can view their scoped report set but do not receive supervisor decision controls in this UI.
- Synthetic supervisor KPIs, fictional facility/worker names, demo inbox rows, local notifications and fake activity timeline were removed from the live supervisor workspace. Inventory, trends and replenishment approvals now show explicit not-connected states instead of invented records.

### Tests and verification
- Added supervisor operations helper tests and controller integration tests.
- Added Supabase client tests for the role-gated embedded inbox query and worker denial.
- **Pending:** fresh CI for the latest checkpoint. Vercel preview status currently reports a team build-rate-limit failure; this is not a successful preview and production has not been changed.
- No live accounts, facilities, reports or synthetic production records were created. A real authenticated workflow remains blocked on approved provisioning.

### Next engineering steps
1. Run the latest GitHub Actions workflow and fix any failures.
2. Implement server-backed worker report history and facility context, including returned notes and resubmission status.
3. Implement controlled administrator provisioning with no self-assigned roles or facility scope.
4. Provision authorised test accounts/facilities only after explicit approval, then test two facilities and two worker/supervisor accounts for cross-scope leakage and the full worker → supervisor → worker cycle.

## Part 2B.4 — worker history and correction resumption — 2026-11-07

- Added a role-gated `listMyReports()` query for the authenticated worker, embedding report items, report events and facility display details.
- Worker record lookup now includes its approved facility's name, district and block LGD code. No facility is inferred from the block directory.
- Added a live worker history controller with report summary, status filters, search, refresh, report detail, supervisor feedback and event timeline.
- Pending view surfaces saved drafts and correction-requested reports with a direct resume action.
- Added `fromDatabaseItems()` to reconstruct the editable worker tables from persisted records. It preserves original source phrases, count/stock clarification text, units and possible-spelling metadata. Values remain provisional and review-required.
- Reopening a correction report preserves its report UUID and original language code. The existing persistence adapter updates that record and resubmits it; it does not create a second report.
- Starting a new report clears the active editor reference so a new narrative cannot accidentally overwrite an older correction. The older draft remains in server history.
- Facility and profile context now render from the authenticated worker record. If no worker/facility assignment exists, the page explains that provisioning is pending.
- Removed the worker's synthetic demo login identity and the local reset control that could have orphaned a server draft.
- Added unit/controller tests for history summaries, empty states, facility context, feedback display, correction resume, source preservation and role-gated queries.

### Verification update
- CI run `42364871547`: all 81 Node tests passed; smoke checks failed on two stale assertions expecting demo credentials and hard-coded dashboard markup. PostgreSQL 17 migration/RLS contract passed.
- CI run `42365023889`: smoke check reduced to one stale supervisor email placeholder assertion; that placeholder has now been removed.
- Worker history and correction-resumption changes are newer than those runs and still require a fresh green CI run.
- Vercel preview remains rate-limited by the team build plan; production domain and data remain untouched.
- No Auth users, facilities, workers, assignments or reports were created in the live Supabase project.
