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
- CI run `42365474633` passed the current worker/supervisor checkpoint: Node 18/22/24, all 90 Node tests, smoke checks, and PostgreSQL 17 migration/RLS contract. Vercel preview still reports a team build-rate-limit failure; production has not been changed.
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
- CI run `42365474633` passed after the worker history and correction-resumption changes: Node 18/22/24, 90 tests, smoke checks and PostgreSQL 17 RLS/database-contract.
- Vercel preview remains rate-limited by the team build plan; production domain and data remain untouched.
- No Auth users, facilities, workers, assignments or reports were created in the live Supabase project.

## Part 2B.5 — administrator provisioning workspace — 2026-11-07

### Administrator UI and role model
- Added a dedicated `admin.html` page and `admin-portal.js` controller. It is not embedded in the public landing page or the supervisor portal.
- The administrator page's Auth gate admits only active `platform_admin`, `state_admin` and `district_admin` profiles.
- UI role choices mirror the intended hierarchy: platform → state/district admin (and facility roles only when verified facilities are visible); state → district admin / supervisor / worker; district → supervisor / worker.
- The browser reads the signed-in profile from Supabase Auth + `profiles`; it does not send a caller role as proof. The Edge Function independently re-reads the profile and active geographic scope with the server-side Supabase context.
- Workers require exactly one facility and explicit data-processing consent. Supervisors may be assigned 1–20 facilities. Administrative roles receive district/state scope rather than facility assignments.
- Administrator invitation acceptance routes to the admin console. The invited user only chooses a password; they cannot select their own role or scope.

### Edge Function hardening
- The function uses `withSupabase({ auth: 'user' })` and `ctx.userClaims` for caller authentication, with privileged operations restricted to `ctx.supabaseAdmin` inside the Edge Function.
- Caller role/status and active scope are re-read from database tables. The shared provisioning service validates hierarchy, temporal scope validity, Chhattisgarh LGD state code, facility status, verification and synthetic-data flags.
- The Auth invitation includes display name and preferred language only; role is written to the protected profile row after Auth creates the account.
- Partial failures attempt profile suspension, assignment rollback and Auth user deletion. Incomplete rollback is returned as an explicit reconciliation error.
- Added JSON content-type validation and a streaming 12 KB request-body limit, including requests without a trustworthy Content-Length header. Responses are no-store; CORS is origin-allowlisted.
- The service-role / secret key is not included in browser files.

### Tests and release boundary
- Added admin portal integration tests, platform-admin provisioning client tests and static Edge Function security-contract tests. Smoke tests now serve and audit `admin.html` and all local assets.
- CI run `42366805845` passed on commit `3ad63f8a106451363ba9e309ce00867d5dd15137`: Node 18/22/24 all green, 117 tests passed with zero failures, smoke checks green, and PostgreSQL 17 database-contract green. The initial CORS assertion mismatch was corrected before this run.
- Supabase currently has zero Auth users, profiles, facilities, workers, assignments, reports and audit records. The project has zero deployed Edge Functions. The provisioning service has not been deployed or invoked.
- Because there are no verified facility records, the admin UI disables worker/supervisor invitations rather than inventing facilities. No live invitation or account was created.
- Vercel preview remains affected by the team build-rate-limit failure. Production domain remains on `main`; this development branch is still PR #5 draft.

### Next steps
1. Get a fresh green CI run including the new Edge Function security-contract test.
2. Validate Edge Function configuration, deployed origin allowlist and invitation redirect URL. Deploy only after explicit release approval.
3. Source and verify Chhattisgarh AAM/HWC facility records, including source date, LGD linkage, duplicates and facility verification status; do not derive facility rows from district/block names alone.
4. Provision an authorised platform administrator through a separately approved secure process, then test admin → district/state admin → worker/supervisor invitation.
5. Run the two-facility/two-worker/two-supervisor isolation test before any production rollout.

## Part 2B.6 — facility registry source review and staging importer — 2026-11-07

- Reviewed MoHFW AAM portal, CGMSC/DPDMIS public facility list, NHSRC NQAS facility counts, ABDM/HFR public registry context and the OGD/National Health Portal hospital directory.
- MoHFW's published operational AAM roster is dated 12-Aug-2024 and its state/district operational report is dated 31-Jul-2024. The page's later 2026 update date does not refresh the downloadable roster.
- DPDMIS is an important state-level reference source, but its visible public list contains mixed facility categories and ambiguous location labels, and the visible page does not establish a current facility-to-LGD crosswalk or reliable snapshot date.
- NHSRC's NQAS report (updated through 31-Mar-2026) supplies certification counts, not a complete operational roster. HFR public aggregate figures likewise do not supply the required facility-level Chhattisgarh export. OGD's National Health Portal hospital directory has old update lineage.
- Added `scripts/validate-facility-import.mjs`, a no-dependency CSV parser and staging validator against the LGD directory. It requires stable source IDs, official facility type, district/block LGD codes, authority, source date and HTTPS source URL. It flags stale snapshots, duplicates and block-parent ambiguity.
- The importer never writes to Supabase. Staged rows are explicitly `needs_review`, non-synthetic and `safe_to_assign=false`; only an authorised human verification process can make a row assignable.
- Added `tests/facility-import.test.mjs` covering CSV quoting/BOM/CRLF, malformed input, duplicate headers, LGD checks, duplicates, stale source and ambiguous mapping.
- Current live `public.facilities` row count remains zero. No facility import or account provisioning was performed.
- **CI:** run `42367099252` passed with the facility importer and tests included: Node 18/22/24, 124 tests with zero failures, smoke checks and PostgreSQL 17 database-contract. Latest branch head `19d49b9c4f98b0cd4ef3a578d5c02f4e7bdf909a` also passed run `42367190160` across Node 18/22/24 and PostgreSQL 17.
- Next gate: obtain a dated authoritative facility export from Chhattisgarh DHS/NHM/CGMSC; reconcile source IDs with HFR/DPDMIS where possible; then conduct a reviewed import. No guessed facility rows or self-assigned locations.

## Part 2C.1 — facility registry onboarding — 2026-11-07

### Database and security
- Added `20261107170000_facility_registry_review_workflow.sql`.
- Import batches record authority, source date, HTTPS URL, importer, declared row count and verified/rejected counts.
- Candidate records preserve external registry ID, facility name/type, Chhattisgarh state/district/block LGD codes, source row and server-derived review flags.
- Both staging tables have RLS enabled and browser roles have no direct table privileges. Service-role-only public RPC wrappers invoke private security-definer functions.
- Batch creation and its audit event are atomic. Staging checks the active admin profile/scope, exact Chhattisgarh district and block parent relationships, row count and maximum chunk size.
- Stale source snapshots and ambiguous/non-selectable block mappings are flagged by the database, not trusted from client input.
- Verification is transactional and creates a facility only when the candidate has no unresolved flags, the reviewer is active and in-scope, the source registry ID is not already present, and no normalised name collision exists. The new facility is active, `verification_status=verified`, `is_synthetic=false`, and retains source provenance.
- Reject decisions and verify decisions are auditable. A batch cannot complete while rows are missing or candidates remain unreviewed.

### Edge Function and admin UI
- Added `supabase/functions/facility-registry/index.ts`: authenticated caller re-check, admin role and active-scope validation, CORS allowlist, 1 MB request limit, 250-row staging chunks, recent-batch list, paginated candidate list, review and completion actions.
- Added `manageFacilityRegistry` to the browser client; no service-role key is included in browser assets.
- Admin workspace accepts raw CSV or the validator's staging JSON, records source authority/date/URL, resumes owned batches after refresh, paginates the candidate queue and requires a human evidence note before verify/reject.
- Candidates with server review flags cannot be verified in the UI; the reviewer must reconcile the source mapping or use a newer source snapshot.

### Tests and release boundary
- PostgreSQL 17 CI contract now applies the facility registry migration and exercises batch creation, staging, verification, facility promotion, audit event and district-scope denial with synthetic CI identities.
- CI run `42369247470` passed on commit `d81ef426acba13dc8b7c95671d72b371798e30b4`: Node 18/22/24, 135 tests with zero failures, smoke checks and PostgreSQL 17 database contract.
- Live Supabase schema has not been migrated; no Edge Function deployed; no Auth users/facilities created. Production remains on `main`.
- No current authoritative Chhattisgarh facility export has been received. Do not seed from stale AAM lists or ambiguous DPDMIS names. The importer is staging/review only and should be run only against a current dated government export.
