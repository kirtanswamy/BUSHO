# BUSHO Development Progress

Last updated: 2026-11-08
Working branch: `feature/chhattisgarh-operational-workflow`
Base branch: `main`
Production branch: unchanged

> This file is the durable hand-off note for continuing the work in a new chat or after a timeout. Update it whenever a milestone changes state.

## Current verified checkpoint — 2026-11-08

- Latest verified feature-branch head at the start of this checkpoint: `a9a04a77710b03afaa0b93ffca91c71760498f3b`. A new documentation-only commit adds the Part 2H.5 test plan; re-check CI and Vercel status for the new HEAD before treating it as deployed.
- PR #5 remains open/draft; no merge to `main`. Production remains unchanged.
- Latest preview before the documentation commit was READY for the exact `a9a04a7` source commit. Landing, sign-in, worker, supervisor, storekeeper and admin HTML routes returned HTTP 200. Worker CSS/JS assets returned HTTP 200. This is route/asset smoke only, not interactive authenticated browser testing.
- Connected Supabase project is `vufnjwkaaqtyukjcvknu`, ACTIVE_HEALTHY. It has 23 public tables and all 23 have RLS enabled.
- Live counts: Auth users 0; profiles 0; facilities 0; workers 0; facility assignments 0; scope assignments 0; reports 0; audit logs 0; inventory items 0; inventory snapshots 0; replenishment requests 0. Reference data: states 1, districts 33, blocks 146, block mapping candidates 2, PMBJK district snapshots 33, state snapshots 1, individual Kendras 0.
- Live migration history still lists only `20261107041935` and `20261107042533`. The feature-branch migrations are not applied live.
- No Supabase development branches currently exist. Creating one can incur hourly compute costs; do not create without explicit owner approval of the displayed cost.
- Live Edge Function inventory is empty. The `provision-user` and `facility-registry` implementations exist in the feature branch but are not deployed.
- Security advisor returned no findings; health advisor returned no findings. Performance advisor reported 48 unused-index informational findings; do not remove indexes solely to silence this advisory.
- New document: [Part 2H.5 authenticated demo plan](docs/part-2h5-authenticated-demo-plan.md). It defines isolated environment choices, synthetic fixtures, positive/negative role tests, evidence requirements and exit criteria. No test environment or identities were provisioned.
- Follow-up preview audit identified that `supervisor.html` still loaded `app-v2.js`, the legacy worker/demo state machine. On supervisor authentication that script could activate the old synthetic `supervisor-panel` with hard-coded Rampur/stock/demo metrics, separate from the new RLS-backed supervisor modules. Removed that script from the supervisor page; the dedicated `supervisor-operations.js` + `supervisor-portal.js` remain. Added a regression test asserting the supervisor page does not load the legacy engine. Commits: `619a6b1` (HTML fix), `0c86eea` (test). Await CI and fresh preview verification.
- Important preview audit finding: the worker and supervisor pages return successful HTML, but the supervisor source still contains static synthetic demonstration markup (e.g. Rampur sample alert, hard-coded demo metrics and stock cards) alongside the authenticated data-driven supervisor controller. Confirm that synthetic sections are hidden/removed in the authenticated supervisor view and labelled clearly before demo acceptance. Do not treat HTTP 200 as UI correctness.
- The current connected project must remain untouched for demos. Do not create live Auth users, facilities, workers, assignments, reports, inventory, apply migrations, or deploy Edge Functions without a separately approved environment and decision.
- Next: inspect and fix the supervisor static-demo leakage on the feature branch; add a regression test; run CI; verify the new preview; then obtain owner choice/approval for local Supabase, a Supabase branch (cost confirmation required) or a separate non-production project before authenticated multi-user browser E2E.

## Milestone tracker

| Part | Scope | Status | Exit criteria |
|---|---|---|---|
| 0 | Repository, data-flow, role and product audit | Complete | Existing product, data-flow, roles and deployment boundaries documented |
| 1 | Operational workflow foundation | Complete | Workflow transitions, explicit approval, external references, receipt guards and audit events covered by tests |
| 2 | Persistent backend and role security | Foundation implemented; live provisioning and multi-user validation pending | Supabase Auth, RLS, column grants, authenticated report persistence and server-controlled role model; authorised users/facilities still required |
| 3 | Health worker portal | Submission, server-backed history, facility context and correction resumption implemented; live E2E pending | Provisioned worker account and facility assignment; authenticated submit/reload/correction/resubmit verified |
| 4 | Supervisor portal | RLS-scoped inbox and review workspace implemented; live E2E pending | Provisioned supervisor and worker identities; cross-facility isolation and review lifecycle verified against live approved test environment |
| 5 | Inventory fulfilment | Workflow state-machine foundation exists; operational inventory/fulfilment UI and live hand-offs pending | Approved inventory source, role workflow, external DPDMIS references, allocation/dispatch/partial receipt and reconciliation |
| 6 | Statewide coverage data | Geography and dated PMBJK snapshots sourced; assignable facility registry blocked | Resolve duplicate LGD parent mapping with live LGD; obtain dated authoritative Chhattisgarh facility master and complete human verification |
| 7 | End-to-end demo/release | Not ready | Approved test identities and facilities, full worker-to-supervisor-to-store workflow, manual browser/security tests, preview and separate release approval |

## Implementation details already committed

- `tests/operational-workflow.test.cjs`: role transition and inventory workflow contract tests.
- `tests/chhattisgarh-directory.test.cjs`: checks sourced data counts, demo seed and PMBJK district snapshot.
- `workflow-core.js`: pure workflow state-transition helper. Worker can submit/resubmit; supervisor can verify, return or escalate; indent recommendation requires a verified report; explicit supervisor approval is required before DPDMIS submission; external references required at submission/allocation/dispatch/receipt; partial/full receipt quantities are validated; no purchase-order flag is ever created.
- `data/chhattisgarh-directory.json`: administrative directory and dated public reference snapshots.
- `.github/workflows/ci.yml`: CI now runs on pushes to feature branches as well as pull requests.

## Data provenance and important caveats

### Chhattisgarh administrative hierarchy

- Source authority: Ministry of Panchayati Raj Local Government Directory (LGD): https://lgdirectory.gov.in/
- The committed snapshot is mirrored/normalised from the public repository `shrinivas-sn/india-lgd-index-api`, whose metadata identifies the LGD source and GODL-India data licence.
- Snapshot date: `21Oct2026`.
- State code: `22` (Chhattisgarh).
- 33 district codes and 146 unique block codes are represented from 147 state-filtered block rows.
- Source has block code `3676` for Khadgawana under both Korea and Manendragarh-Chirmiri-Bharatpur district codes. It is marked `mappingReviewRequired`; do not silently resolve it without checking live LGD.

### AAM / Chhattisgarh stock processes

- AAM national programme: https://aam.mohfw.gov.in/
- Chhattisgarh DPDMIS AAM: https://dpdmis.in/shcangm/
- Chhattisgarh DPDMIS Health Facility Store: https://dpdmis.in/faconline/
- CGMSC: https://cgmsc.gov.in/
- DPDMIS exposes opening stock, indent to warehouse / facility, receipt, consumption, stock register, near-expiry and hold-batch workflows, with manuals and tutorials.
- BUSHO should capture and route observations/approval hand-offs with an external DPDMIS reference. It must not claim to replace DPDMIS or silently create a real indent/order.

### Jan Aushadhi / PMBJP

- Official PMBJP locator: https://janaushadhi.gov.in/
- PIB district-wise snapshot: 352 Chhattisgarh Jan Aushadhi Kendras as at 2026-02-28: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2239566&lang=2&reg=48
- PIB state aggregate snapshot: 371 Chhattisgarh Kendras as at 2026-06-30: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2297561&lang=1&reg=48
- The snapshots have different dates and granularity. Do not combine them into one time series or claim they reconcile.
- PMBJK is a separate scheme/network; do not treat it as an AAM facility or CGMSC warehouse.

## Data modelling rules

1. A block is an administrative unit, not a health facility. Never invent an AAM/HWC facility count or create a facility for every block.
2. Unseeded blocks should display zero BUSHO operational demo records, not fabricated "normal" stock or activity.
3. Keep facility registry source, source date, identifier, facility type and parent geography.
4. Every worker is assigned to a facility and role. A supervisor only sees assigned scope.
5. A worker-confirmed report is not a supervisor-verified report.
6. Report review is distinct from administrative indent approval.
7. A supervisor approving a draft is not the same as DPDMIS submission, state warehouse allocation, dispatch, or facility receipt.
8. Record external system references for each hand-off. Do not fake transit/receipt statuses when no external reference or synthetic test action exists.
9. PMBJK data is discovery/reference data only unless an authorised integration and operating agreement says otherwise.
10. Never store patient names, phone numbers, Aadhaar numbers or identifiable clinical data in this prototype.

## Known technical constraints / blockers

- `role-auth.js` gates portal entry using Supabase Auth and the server-controlled `profiles` row. This is a browser-side UX gate; the actual data boundary is PostgreSQL RLS and column grants.
- Operational reports, items and events are persisted in Supabase. Worker localStorage is only a per-user recovery checkpoint before submission, not a shared operational source of truth.
- The live project currently has no Auth users, worker records, facility records or assignments. Do not create live accounts/facilities or insert production demo records without an authorised provisioning decision.
- Supervisor inbox reads only submitted/reviewed workflow states and is scoped by the database RLS policies. The database policy itself still grants supervisors read access to assigned-facility reports; UI filters are not a substitute for a tighter policy if draft confidentiality requirements change.
- Vercel preview can be rate-limited by the team plan. A Vercel status of build-rate-limit is infrastructure/plan feedback, not evidence of a code regression. Production domain remains attached to `main`.
- Repository edits are committed through GitHub API because the local container cannot resolve GitHub; GitHub Actions is the authoritative automated test runner.

## Review checkpoint

- Draft PR: https://github.com/kirtanswamy/BUSHO/pull/5
- PR is open, mergeable and deliberately unmerged.
- Latest verified PR CI run: https://github.com/kirtanswamy/BUSHO/actions/runs/42265557716
- Vercel deployment status for PR head: success (from the GitHub commit status).

## Recent commits on this branch

- `aa5e25f` — test: define Chhattisgarh operational workflow contracts
- `c5e9ece` — data: add sourced Chhattisgarh LGD and PMBJK directory
- `b7ef471` — feat: add validated report and inventory workflow state machine
- `9bcf0e7` — test: require explicit supervisor indent approval
- `f159b50` — ci: run checks on operational feature branches
- `63fb528` — fix: require supervisor approval before DPDMIS submission
- `784b60d` — test: provide receipt reference when checking quantity guard

Latest verified CI run `42365474633` passed Node 18/22/24 (90 tests, 0 failures, smoke checks green) and PostgreSQL 17 migration/RLS database-contract. Vercel preview remains rate-limited by the team build plan.

## Immediate next actions

1. Verify the latest supervisor workspace CI; fix every failure before calling Part 2B.3 green.
2. Build worker server-backed report history, assigned-facility context, review notes and resubmission status.
3. Design and implement administrator-controlled provisioning; no self-assigned roles, no self-selected facility scope, and no live account creation without authorisation.
4. After authorised test identities and facilities are provisioned, run a two-worker/two-facility/two-supervisor end-to-end RLS isolation test.
5. Connect inventory and replenishment only after the report workflow is proven; preserve explicit DPDMIS hand-off references and do not claim external API integration.
6. Refresh the preview when Vercel build capacity permits; keep production on `main` until release criteria pass.

## Resume prompt for a new chat

Continue BUSHO from this repository and branch:

`https://github.com/kirtanswamy/BUSHO/tree/feature/chhattisgarh-operational-workflow`

First read this `PROGRESS.md`, inspect the latest commit and GitHub Actions status, and continue from **Immediate next actions**. Do not redo the completed audit or overwrite the work. Finish one milestone at a time, add tests first, commit every completed part, and update this document at the end of each part.

## Part 2B integration checkpoint — 2026-11-07

- Read-only portal/database integration review saved at [docs/part-2b-integration-review.md](docs/part-2b-integration-review.md).
- Confirmed that Supabase Auth gating and database client helpers exist, but worker extraction/confirmation and supervisor inbox still use separate browser-local synthetic stores. The actual portal workflows are not yet wired to persistent reports.
- Confirmed the live database contract for `reports`, `report_items`, `report_events`, `workers`, `facilities`, `profiles`, and `user_facility_assignments`.
- The live project currently has no operational facilities, workers, or Auth users, so a real authenticated workflow cannot be demonstrated until an authorised administrator provisions test/real accounts and facility assignments.
- No production data, Auth users, database migrations, or production deployments were changed during this checkpoint.
- **Current active milestone:** Part 2B.1 — portal integration boundary and tested report persistence mapping. Preserve the extraction engine and current visual system; do not treat localStorage as shared operational truth.
- Existing draft PR #5 remains open and unmerged. Keep the PR draft until the end-to-end acceptance criteria in the integration review are met.

### Part 2B.1 — persistence boundary (in progress)

- Saved the integration audit and implementation checkpoint in `docs/part-2b-integration-review.md`.
- Added `report-persistence.js` to map worker extraction tables into the live `report_items` contract (`symptom_trend` and `stock_observation`). Source text remains separate; no confidence score is invented; all extracted fields require review.
- Extended `supabase-client.js` with `updateReportDraft` and `replaceReportItems`. Item replacement is limited by the live database RLS policies to the authenticated worker's own report while it is `draft` or `correction_requested`.
- Persistence coordinator checkpoints the report ID locally before item writes, resumes the same report instead of creating another one, updates the source text when a returned report is corrected, and only reports submission success when the server returns a submitted report.
- Added tests in `tests/report-persistence.test.cjs` and expanded `tests/supabase-client.test.cjs` for mapping, validation, request ordering, draft resumption, item replacement and failure handling.
- **Not yet complete:** worker page is not wired to this module; supervisor inbox is still synthetic; no Auth users or facility assignments exist; no live multi-user test has been run.
- **Verification:** latest commit at the time of this note is the docs checkpoint; GitHub Actions and Vercel status are not yet confirmed green. Do not call Part 2B.1 complete until CI passes and the portal is wired.

### Part 2B.2 — worker portal Supabase integration (in progress)

- Connected the worker confirmation action in `app-v2.js` to `BUSHO_REPORT_PERSISTENCE.persistConfirmedReport`.
- Worker report drafts are now stored under an Auth-user-specific local key. The old shared demo-state key is no longer used by the worker app.
- Auth lifecycle events are dispatched on `document` and restore the correct account's draft state after sign-in/session restoration; logout clears the in-memory account state.
- Report ID is durably checkpointed before report-item writes. Failed writes/submission can resume the same report; ambiguous successful submits are reconciled by reading the server report status.
- Local report narrative/extraction is cleared from local storage after server submission. Logout is disabled during an in-flight submission.
- Disabled the worker's synthetic cross-role localStorage report bridge. Removed fictional worker report rows, fake activity metrics and the hard-coded Rampur facility from the worker portal. Until real history/context is wired, the portal displays honest empty/pending states.
- Updated confirmation and privacy guidance across supported languages: workers are told the report is sent to supervisor review and not to enter patient names, phone numbers or diagnoses.
- Added `tests/worker-portal-integration.test.cjs` and expanded persistence/client tests.
- **Verification checkpoint:** CI run `42363981095` passed Node 18/22/24 and PostgreSQL 17 RLS/database-contract jobs for the worker integration code. Later translation/copy-only commits have a successful Vercel preview; latest checkpoint CI run `42364121713` passed Node 18/22/24 and the PostgreSQL 17 RLS/database-contract job; the Vercel preview deployment also reports success.
- **Not yet complete:** no live Auth users, facilities or worker assignments exist in Supabase; no live end-to-end account test is possible yet. Supervisor inbox/review and worker report history remain to be integrated. Do not deploy to production or merge PR #5 yet.
- Detailed review: `docs/part-2b-integration-review.md`.

**Next milestone:** Part 2B.3 — server-backed worker report history and assigned-facility context, followed by supervisor inbox/review. In parallel, design a controlled administrator provisioning flow; never let a user set their own role or facility.

## Part 2B.3 — supervisor operations workspace (implementation checkpoint)

- Added `listSupervisorReports()` to the authenticated Supabase client. It requires a supervisor/district-admin/state-admin profile and fetches reports plus embedded `report_items`, `report_events`, worker display details and facility display details. The query filters out unsubmitted draft states from the supervisor inbox.
- Verified the live foreign-key relationships and RLS policies for reports, report items, report events, workers and facilities before building the embedded query. The report inbox relies on the existing `reports_scoped_select` policy and child-table scope policies; it does not accept a caller-supplied facility scope as an authorization boundary.
- Added `supervisor-operations.js` and `supervisor-portal.js`: role-aware live dashboard, RLS-scoped inbox, report detail, original narrative, structured observations, review note, audit timeline, search, filters and refresh.
- Supervisor decisions are restricted to the existing database transition graph: submitted/resubmitted → verify, request correction, escalate or reject; escalated → verify, request correction or reject; verified → close. The database trigger remains authoritative.
- District/state admins can view scoped reports but the UI does not expose supervisor review actions to those roles. Worker role is rejected by the client before inbox query.
- Replaced hard-coded supervisor KPI counts, fictional facilities/workers, synthetic report rows, synthetic trend and activity examples with database-derived counts or honest not-connected/empty states. Inventory and administrative approvals are explicitly not yet connected.
- Disabled the supervisor's browser-local synthetic notification/report bridge. The worker's separate workflow is not changed by this guard.
- Added responsive report detail/review styling and removed the supervisor page's demo reset action.
- Added `tests/supervisor-operations.test.cjs`, `tests/supervisor-portal-integration.test.cjs` and supervisor inbox client tests.
- **Verification:** CI run `42365474633` passed Node 18/22/24, all 90 Node tests and the PostgreSQL 17 migration/RLS database-contract job. The Vercel preview remains rate-limited by the team plan; production remains untouched.
- **Known limitation:** no Auth users/facilities/workers/assignments/reports exist in the live project, so no live supervisor screen or real review transition has yet been demonstrated. The automated tests use controlled fixtures.
- **Next:** run CI, fix all test failures, then build worker report history/assigned facility context and a secure administrator provisioning workflow. Only after provisioning should a two-account/two-facility end-to-end test be attempted.

## Part 2B.4 — worker history, facility context and correction resumption (implementation checkpoint)

- Extended the worker's authenticated report-history query to require an active worker profile and include related facility display context. The database RLS policy remains the ownership boundary.
- Extended the worker record query to include the approved facility name, district and block LGD code; no facility is inferred from geography.
- Added `worker-history.js` and `worker-portal.js`: account-scoped report history, live worker summary, pending drafts/returns, report detail, supervisor feedback, audit timeline, search, status filters and refresh.
- Added `fromDatabaseItems()` to reconstruct the editable condition/medicine tables from persisted report items, preserving source phrases, quantity uncertainty and review notes.
- Added a safe correction-resume path: worker can reopen only a `draft` or `correction_requested` report. The original report ID and original report language are retained, so resubmission updates the same record instead of creating a duplicate.
- Starting a new report explicitly clears the current editor's report reference so a new field note cannot accidentally overwrite a returned report. The old server draft remains available in history.
- Worker dashboard summary, facility context and profile sections now derive from the authenticated worker record and that account's report history. Missing worker/facility records show an explicit provisioning state.
- Removed synthetic worker login identity and the worker page's unsafe demo-reset action. Local recovery drafts remain per-account and are removed after server submission.
- Added `tests/worker-history.test.cjs`, worker history query tests, rehydration tests and portal integration assertions.
- **Verification:** CI run `42365474633` passed the full current checkpoint: Node 18/22/24, 90 tests with zero failures, smoke checks green, and PostgreSQL 17 migration/RLS database-contract green. Earlier smoke failures were stale expectations for demo credentials/static dashboards and were corrected.
- **Live environment limitation:** the Supabase project still has no Auth users, worker records, facilities, assignments or reports. No real multi-account user journey has been demonstrated.
- **Next:** get the current CI green, then build controlled administrator provisioning and execute a two-facility cross-scope test with explicitly authorised test accounts.

## Part 2B.5 — controlled administrator provisioning workspace (implementation checkpoint)

- Added `admin.html` and `admin-portal.js`: a separate administrator-only workspace with server-controlled role allowlists, invitation form, facility assignment selection, district selection, worker consent confirmation, invitation feedback and facility-readiness state.
- Extended `role-auth.js` with a dedicated administrator portal allowlist for platform, state and district administrators. Worker/supervisor portals retain their separate role gates.
- Added the platform administrator to the client-side provisioning call allowlist. Platform administrators can issue state/district administrator invitations; the server-side hierarchy remains authoritative. Facility-based roles are disabled in the UI when no verified facility is visible.
- Updated invitation acceptance to route administrator roles to `admin.html`; users still cannot choose or modify their own role/scope.
- Fixed a subtle form issue: hidden facility selections are excluded when inviting an administrative-scope user, and worker selection is limited to exactly one facility even if a supervisor selection had previously been made.
- Hardened the Edge Function request parser: JSON content type required, body bounded to 12 KB while streaming (not only trusting Content-Length), malformed payloads return explicit client errors, and responses are no-store. Origin allowlist remains configurable through `BUSHO_ALLOWED_ORIGINS`.
- Added administrator portal integration tests, platform-admin client tests, portal role-policy tests, Edge Function security-contract tests, and smoke checks that verify the new page and all its assets.
- Rewrote the README's stale demo-only claims to describe the actual development branch and its release boundary. It now clearly distinguishes implemented code/database objects from deployed services and validated real-world workflows.
- **Verification:** CI run `42366805845` passed on commit `3ad63f8a106451363ba9e309ce00867d5dd15137`: Node 18/22/24 all green, 117 tests passed with zero failures, smoke checks green, and PostgreSQL 17 database-contract green. The earlier CORS test expectation failure was fixed; the current checkpoint is green.
- **Live environment boundary:** Supabase still has zero Auth users, profiles, facilities, workers, assignments, reports and audit rows. There are currently zero deployed Edge Functions. The `provision-user` function is code only; it has not been deployed or invoked. No invitations, live records or production deployments have been created.
- **Facility data blocker:** because there are no verified facilities, the admin UI intentionally disables worker/supervisor invitations. State/district administrator invitations can be prepared by the platform admin once the function is deployed and an authorised platform-admin account exists.
- **Next:** verify CI including the new Edge Function contract tests; review the Edge Function deployment configuration and CORS origins; only deploy after explicit release approval. Then verify the official Chhattisgarh facility source and import/validate facility records before inviting workers/supervisors. Do not fabricate facility data.

## Part 2B.6 — facility registry source review and safe import staging (implementation checkpoint)

- Researched current government and national sources before seeding facilities. The MoHFW AAM portal's linked operational list is dated 12-Aug-2024 and state/district totals are dated 31-Jul-2024; the portal's 2026 page update does not refresh the underlying file.
- Reviewed CGMSC/DPDMIS public facility details as a state source, NHSRC NQAS certification counts through 31-Mar-2026, ABDM/HFR public registry context, and the older OGD/National Health Portal hospital directory. These sources have different scopes and dates; none is sufficient alone to create a verified, complete facility master.
- Added `docs/facility-registry-source-review.md` with source limitations and the exact fields required from a current Chhattisgarh DHS/NHM/CGMSC export.
- Added `scripts/validate-facility-import.mjs`: dependency-free CSV parser and validator against the existing 33-district / 146-block LGD snapshot. It checks stable source IDs, facility type vocabulary, district/block LGD validity, block-parent mapping, duplicates, source date and HTTPS provenance.
- Import output is explicitly staging-only. Every candidate remains `needs_review`, `is_synthetic=false`, and `safe_to_assign=false`. The script does not connect to Supabase or write database rows.
- Added tests for quoted CSV parsing, duplicate headers, invalid LGD codes, block/district mismatch, duplicate IDs/names, source metadata, stale snapshots and ambiguous block-parent mappings.
- **Live environment remains unchanged:** `public.facilities` has 0 rows; there are 0 workers, assignments, Auth users and reports. No facilities were fabricated, imported or marked verified.
- **Verification:** CI run `42367099252` passed with the facility importer and tests included: Node 18/22/24 all green, 124 tests passed with zero failures, smoke checks green, and PostgreSQL 17 database-contract green. The latest branch head `19d49b9c4f98b0cd4ef3a578d5c02f4e7bdf909a` also passed CI run `42367190160` (Node 18/22/24 and PostgreSQL 17 database-contract).
- **Next:** verify the latest importer CI; obtain an authoritative, dated Chhattisgarh facility master export; reconcile facility IDs and LGD codes; review candidate rows; then use a separately approved, audited import to seed only verified facilities. Keep worker/supervisor invitations disabled until that is complete.

## Part 2C.1 — facility registry onboarding and human verification workflow (implementation checkpoint)

- Added migration `20261107170000_facility_registry_review_workflow.sql` for provenance-backed import batches and facility candidates. Candidate tables have RLS enabled and no browser-role table grants; service-role-only RPC wrappers call private security-definer functions.
- Batch creation is atomic with its audit event. The database enforces source authority/date/HTTPS URL, expected row limits, active administrator role and active Chhattisgarh geographic scope.
- Candidate staging is chunked (maximum 250 per request), checks active state/district scope, district/block LGD parent mappings, facility type, source row range and batch size. Stale source snapshots and ambiguous/non-selectable block mappings receive server-derived review flags; the browser cannot remove them.
- Human review is transactional. Verification requires an active in-scope administrator, an 8–1000 character evidence note, zero unresolved flags, valid Chhattisgarh geography and no existing external registry ID or normalised facility duplicate. Only then does the database create an active, verified, non-synthetic facility and append an audit event.
- Rejection is also recorded. Batch completion is blocked until all declared rows are staged and every candidate has a final decision.
- Added authenticated `facility-registry` Edge Function code for create/stage/list/review/complete actions. Caller identity, profile and scope are re-read server-side; CORS is allowlisted; body limit is 1 MB; each stage chunk is limited to 250 rows. The function is not deployed.
- Added admin UI controls for CSV or validator-JSON import, source provenance, chunked staging, paginated review, evidence notes, verify/reject actions, and loading recent owned batches after refresh. Partial staging can be resumed in the current browser session; existing batches remain discoverable after reload.
- Added tests for client role gating, admin UI, Edge Function security contract, migration permissions and database-level create/stage/review/promote/reject-scope workflow using synthetic CI identities only.
- **Verification:** CI run `42369247470` passed on commit `d81ef426acba13dc8b7c95671d72b371798e30b4`: Node 18/22/24 and PostgreSQL 17 database contract green; 135 tests passed, zero failures; smoke checks green. The final documentation update is covered by this green run.
- **Live environment unchanged:** no migration applied to connected Supabase, no Edge Function deployed, no accounts or facilities created. `public.facilities` remains empty. Production domain remains on `main`.
- **Data gate:** no authoritative current Chhattisgarh facility export has been received. The UI accepts a dated source export, but no import should be started with the older AAM snapshot or an unverified DPDMIS name list. Use the source assessment in `docs/facility-registry-source-review.md`.
- **Next:** get a green CI run on the latest branch head; have the state provide a dated DHS/NHM/CGMSC export with stable IDs and LGD codes; run the staging validator; review mapping flags; only then schedule a separately approved live schema migration and deploy the Edge Function with exact production/preview origins.


## Part 2C.2 — role, responsibility and permission blueprint (implementation checkpoint)

- Added `docs/role-responsibility-permission-blueprint.md` as the product/engineering contract for the Chhattisgarh reference implementation.
- Separates Auth identity, generic application role, cadre/designation, facility assignment, geographic scope and task capability. This avoids incorrectly turning CHO/ANM/MPW/ASHA/Pharmacist/MO into interchangeable permission roles.
- Documents evidence labels (source-confirmed, implemented in code, validate locally, future approval required), the responsibility matrix, server-side access rules, report/stock hand-offs, synthetic/reference data classification and a narrow Dhamtari reference slice.
- Explicitly keeps Jan Aushadhi separate from AAM/CGMSC facilities and stock. Calls out that current schema lacks AAM-PHC distinction and a delegated MO/facility-head capability; these are gaps, not permissions to infer.
- Captures local validation questions and implementation sequence 2C.3 → 2D → 2E → 2F → 2G → 2H. No connected Supabase schema, users, data or deployment changed.
- This is a documentation checkpoint; it does not assert field validation or live workflow readiness. The next coding step is 2C.3 policy/schema alignment, preceded by tests and a review of current RLS draft visibility.


## Part 2C.3 — policy and facility taxonomy alignment (implementation checkpoint; CI pending)

- Added `supabase/migrations/20261107190000_busho_role_policy_alignment.sql` on the feature branch.
- Added `aam_phc` as a distinct facility type in both the facilities and facility-registry candidate constraints; updated the staging validator and added a test proving AAM-PHC candidates remain `needs_review` and non-assignable.
- Tightened report SELECT RLS: a worker can still read their own draft; assigned supervisors and scoped administrators can read reports only after submission (non-draft). Added a PostgreSQL RLS contract case that creates a same-facility private draft and asserts the supervisor cannot read it.
- Updated CI to apply the new migration after the facility registry migration and before the PostgreSQL RLS contract; added migration-order and policy regression assertions.
- No cadre field or new cadre-based permissions were added: CHO/ANM/MPW/ASHA/pharmacist/MO remain descriptive workforce designations pending local validation, not authorisation roles.
- **Status:** implementation committed; the latest branch commit has not yet produced a visible CI run at the time of this note. Do not call this migration validated until Node 18/22/24, PostgreSQL 17 contract and smoke checks pass.
- **Live environment unchanged:** no connected Supabase migration, user, facility, report, Edge Function deployment or production release was changed.


## Part 2D — versioned medicine reference catalogue (foundation checkpoint)

- Located the official Chhattisgarh Health & Family Welfare Department **Essential Drug List 2025**, notified 12-Nov-2025 and published through DPDMIS. Annexure 4 covers PHC/PHC-AAM/UPHC (172 numbered entries, printed pages 48–53); Annexure 5 covers SHC-AAM (106 numbered entries, pages 54–57).
- Added `supabase/migrations/20261107200000_medicine_reference_catalogue.sql`: versioned source releases, verbatim source entries, explicit facility-level scope, source page/row provenance, nullable normalized fields, and optional reference link from existing facility-specific inventory items.
- Catalogue tables are authenticated read-only to browser roles; trusted service-side ingestion is required for writes. Reference entries do not imply stock, dispensing, procurement, clinical recommendation or actual facility applicability.
- Added `data/medicine-catalogue/chhattisgarh-edl-2025-sample.json`: a deliberately small 10-row PHC-AAM/UPHC and 14-row SHC-AAM sample. Separately, both complete numbered annexures are now transcribed in the source-transcription files below. The `sampleOnly: true` flag on those full transcription files is currently a non-importability safety marker with a misleading name; do not remove it until a tested schema/consumer migration replaces it.
- Added `data/medicine-catalogue/chhattisgarh-edl-2025-shc-aam-source-transcription.json`: all 106 numbered SHC-AAM Annexure 5 rows transcribed from PDF text with category, source description and printed footer page. It remains `transcribed_from_pdf_text_unreviewed`.
- Added `data/medicine-catalogue/chhattisgarh-edl-2025-phc-aam-source-transcription.json`: all 172 numbered PHC-AAM/UPHC Annexure 4 rows transcribed from PDF text. Together both annexure files cover all 278 numbered EDL rows, but both remain `transcribed_from_pdf_text_unreviewed`; rendered-PDF reconciliation and pharmacist/CGMSC review are still mandatory before normalization or import.
- Added `scripts/audit-medicine-source-transcriptions.mjs` and tests to audit all 278 rows for complete sequence, printed-page mapping, duplicate/mismatched facility labels, premature normalized fields and likely OCR/spelling anomalies. It outputs a review-only report; it does not correct source text or authorize ingestion.
- The audit report also initializes a blank human review queue for all 278 rows: source-PDF verification, reviewer identity/date, row interpretation, candidate item list, facility applicability, local DPDMIS code and evidence are all pending; no normalized fields are populated.
- Added `scripts/validate-medicine-review-decisions.mjs`: a review batch must match source row/page/text, record a rendered-PDF check, named reviewer, designation, organization-confirmed authority, review timestamp and evidence. Any candidate mapping must include form, strength, stock unit and matching facility level. Even a valid review batch is explicitly not live-import or prescribing authorization.
- Added catalogue schema/sample tests, a source-transcription validator (provenance, annexure/facility-level mapping, unique source row numbers, page bounds, and no guessed normalized stock units), and PostgreSQL contract fixtures verifying reference reads and optional inventory-item linking. CI now applies the catalogue migration after the previous migrations.
- **Verification:** CI run `42391034680` passed on the latest branch head: Node 18 and 22 each passed 151 tests; Node 24 check passed; PostgreSQL 17 database contract passed, including all migrations and worker/supervisor/admin/stock RLS assertions. This verifies schema, data-structure and policy contracts, not clinical correctness or human transcription accuracy.
- **Live environment unchanged:** no connected Supabase migration, medicine rows, inventory rows, stock balances, facility mappings, DPDMIS transactions, Edge Function deployment or production release.
- Next substage: human-reconcile all 278 source rows and footnotes against rendered PDF pages; then obtain pharmacist/CGMSC review before normalizing formulations, units, local item codes or facility applicability.


## Part 2D.1 — structural audit and reconciliation queue — 2026-11-07

- Opened the official 59-page Chhattisgarh EDL 2025 PDF from DPDMIS. The notification is dated 12-Nov-2025; Annexure 4 starts at printed page 48 and Annexure 5 at printed page 54.
- Re-ran the structural checks against both repository source-transcription JSON files: Annexure 4 has 172 rows; Annexure 5 has 106; total 278. Row numbering is contiguous, annexure keys and facility-level labels match, descriptions are non-empty, and printed-page mappings match the repository's expected page ranges. Structural errors: 0.
- Created `data/medicine-catalogue/chhattisgarh-edl-2025-review-queue.json` with all 278 source rows and explicit per-row review fields. Every row remains `pending_source_reconciliation`, `sourcePdfChecked: false`, and `normalizedFieldsAllowed: false`.
- Machine triage flags 15 rows: 1 possible truncated unit/OCR issue, 6 source spelling/OCR checks and 8 programme-guideline references. Flags are review prompts, not automatic corrections. The row-level details are in the review queue.
- Corrected `docs/medicine-reference-catalogue.md` so it no longer incorrectly claims the complete annexures have not been transcribed. The full rendered-PDF reconciliation, PDF hash capture, independent second-person review, pharmacist/CGMSC review, normalization and import are still outstanding.
- Known source JSON schema debt: `sampleOnly: true` is semantically misleading for the full 278-row transcriptions. It currently functions as a safety lock. Replace it only with a separately tested explicit completeness/import-approval model after auditing every consumer and test.
- No Supabase migration, live catalogue insert, facility import, account provisioning, Edge Function deployment or production release was performed.
- **Next:** complete row-by-row rendered-PDF comparison, starting with all 15 flagged rows and then the remaining rows/footnotes; capture the original PDF SHA-256; do not normalize or ingest until a named authorised pharmacist/CGMSC reviewer signs off.


## Part 2D.2 — transcription cross-check and PDF access boundary — 2026-11-07 (superseded by Part 2D.3)

- Re-examined the 15 machine-flagged rows using the repository's two source-transcription JSON files. This is a comparison of stored transcribed text only; it is **not** a comparison against the official PDF text layer or rendered PDF pages.
- The PHC Annexure 4 item 36 transcription ends with `200 mg/5 m`. Part 2D.3 subsequently confirmed this same truncation is visibly present in the uploaded PDF.
- The PHC Annexure 4 item 12 transcription contains `Asprin`; item 102 and SHC Annexure 5 item 60 both contain `Gama Benzene Hexachloride`. Preserve these source strings until the PDF and authorised reviewer establish whether they are source spellings or transcription errors.
- Found a cross-annexure discrepancy in the repository transcriptions: Annexure 4 item 172 says `Medroxprogesterone Acetate Injection 150 mg`, while Annexure 5 item 81 says `Medroxyprogesterone Acetate Injection 150 mg`. Part 2D.3 confirmed both spellings are present in the rendered source PDF; this is a source-document inconsistency.
- Programme-guideline rows (Annexure 4 items 52, 53, 58, 135; Annexure 5 items 27, 28, 32, 87) are instructions/references rather than obvious medicine product descriptions. Preserve their source rows, but do not map them to inventory products without formal interpretation.
- **Evidence boundary:** the official DPDMIS PDF URL was opened as a web document, but PDF page screenshots/text extraction did not return usable page content in this session, and direct download failed. No rendered page was visually inspected. The queue still has all 278 rows marked `sourcePdfChecked: false`; no row has a PDF verification claim.
- No clinical review, normalization, facility applicability approval, live import or procurement use is approved.
- Next: obtain the official PDF locally or as a user-provided attachment, render printed pages 48–57, compare all rows and footnotes, capture SHA-256, then obtain authorised pharmacist/CGMSC review.


## Part 2D.3 — uploaded PDF visual spot-check and page provenance correction — 2026-11-07

- User supplied the 59-page `EDL_2025.pdf`; SHA-256 recorded as `6e9b8e83d93fcd613328214dde4f979d592d8af0e01c3d4e41a26b0d0ee1c72e`.
- Visually inspected the annexure pages and targeted all 15 machine-flagged rows plus SHC Annexure 5 item 81 (16 rows total). Row-level visual notes and evidence hash are in the review queue. These checks are not pharmacist/CGMSC approval.
- **Important audit correction:** the earlier source-page map was systematically one page too high. Actual printed footer ranges are Annexure 4 pages 47–52 and Annexure 5 pages 53–56. Updated both source-transcription files, the 24-row sample, review queue, audit script and catalogue documentation.
- Confirmed Annexure 4 item 36 visibly ends `200 mg/5 m`; do not infer the missing `l`. Confirmed Annexure 4 item 12 visibly prints `Asprin`, Annexure 4 items 102/106/118 retain their printed spellings, and programme-reference rows are not medicine SKUs.
- Confirmed a genuine source-document inconsistency: Annexure 4 item 172 prints `Medroxprogesterone`, while Annexure 5 item 81 prints `Medroxyprogesterone`. Preserve both verbatim and escalate for authorised review.
- 16 rows have targeted visual evidence; 262 still need individual row-level comparison. All 278 remain non-importable and not clinically approved.
- No Supabase migration, live catalogue insert, facility import, account provisioning, Edge Function deployment or production release was performed.


- **Validation follow-up:** the first CI run after correcting the page map exposed stale hard-coded ranges in `scripts/validate-medicine-catalogue.mjs` and the validator test fixture. Updated the validator to use the verified footer pages and changed the wrong-page regression fixture so it still tests a genuinely incorrect value. A fresh CI run is required before this correction is considered validated.


## Part 2D.4 — full transcription text consistency and two additional truncations — 2026-11-07

- Automated page-scoped comparison of all 278 source descriptions against the extracted text for the corresponding uploaded PDF page returned 278/278 normalized text matches after source corrections.
- Two additional transcription issues were found during this pass: PHC Annexure 4 item 37 had been expanded beyond the printed `Diethylcarbama`; SHC Annexure 5 item 22 had been expanded from the printed `80 mg/m` to `80 mg/ml`. Both source transcriptions now preserve the visible source strings verbatim.
- Updated the audit script to flag the truncated PHC item 37 and SHC item 22; updated tests to assert both conditions.
- Targeted rendered-page evidence now covers 18 rows; 260 rows remain without individual row-level visual evidence. The 278/278 automated text match is not clinical approval, normalization approval or a substitute for the remaining visual review.
- All rows remain non-importable. No live Supabase or production changes were made.


- **CI verification:** latest CI run `42394392227` passed on the updated EDL page-map and transcription corrections: Node 18/22/24 checks and PostgreSQL 17 database contract all succeeded. This is CI-only verification; no connected Supabase migration or production deployment occurred.


## Part 2D.5 — rendered-page OCR discrepancy correction — 2026-11-07 (superseded by Part 2D.6)

- Visual inspection of PHC Annexure 4 item 17 (printed page 47, physical PDF page 49) found the rendered source reads `Levocetirizine` twice. The PDF text layer and prior transcription had `Levocetrizine` in the second occurrence. Corrected the source transcription to the rendered page and recorded the discrepancy.
- At this intermediate checkpoint, 19 rows had targeted visual evidence. Part 2D.6 subsequently completed the full 278-row page review.


## Part 2D.6 — complete rendered-page source reconciliation — 2026-11-07

- Rendered and visually inspected all 10 annexure pages at high resolution; all 278 numbered entries are mapped to the correct annexure, row number, printed page and physical PDF page.
- Completed page-scoped text comparison of all 278 source descriptions against the corresponding PDF page. 278/278 matched after correcting the OCR spelling in PHC item 17 to the rendered Levocetirizine.
- Preserved visible source truncations in PHC items 36/37 and SHC item 22, plus the genuine source spelling difference between PHC item 172 and SHC item 81.
- Recorded highlighted source spans and source notes separately; no asterisk meaning is inferred where the PDF provides no legend.
- Review queue now records rendered-PDF and text-layer checks for all 278 rows. All remain pending authorised pharmacist/CGMSC review; no normalized medicine mappings or live catalogue imports are approved.
- No connected Supabase migration, live insert, facility import, account provisioning, Edge Function deployment or production release occurred.


## Part 2D.7 — source annotation preservation and review-gate tests — 2026-11-07

- Added `data/medicine-catalogue/chhattisgarh-edl-2025-source-annotations.json` with seven highlighted source spans, 23 source notes/conditions and the complete asterisk-marked row list from both annexures.
- Added tests requiring the review queue to contain 278 visually/text-checked rows, with every row still pending authorised review, no reviewer assigned, no candidate normalized items, and live/stock/prescribing import gates closed.
- Added tests for highlighted-span and source-note preservation.

- Follow-up test-schema check: the review queue exposes its safety gates under `policy.safeToImportToLive` / `policy.safeForStockOrPrescribing` (not `import_policy`). The new assertions were aligned to the actual queue schema in commit `9150dc9`; latest-head CI must confirm them.

- **Latest-head CI:** run `42395089510` passed after the 278-row review queue, annotation register and regression tests were added. Node 18, Node 22, Node 24 and PostgreSQL 17 database-contract/RLS verification all succeeded.


## Part 2D.8 — authorised reviewer hand-off package — 2026-11-07

- Prepared `docs/edl-authorised-review-protocol.md` with reviewer authority requirements, row-level procedure, known source discrepancies, programme-reference handling, asterisk/highlight cautions and explicit non-authorization boundaries.
- Prepared `data/medicine-catalogue/chhattisgarh-edl-2025-pharmacist-review-template.csv` containing all 278 source rows, source page provenance, flags, highlighted spans, source notes and blank reviewer/mapping decision fields.
- Engineering-side source reconciliation is complete. The remaining gate is named, organization-authorized pharmacist/CGMSC review and recorded decisions. Do not normalize, import, or enable stock/prescribing use until that review and a separate release decision are complete.
- No connected Supabase migration, live catalogue insert, facility import, account provisioning, Edge Function deployment or production release was performed.


## Part 2E — synthetic two-supervisor / two-facility RLS test extension — 2026-11-07

- Extended `tests/postgres-rls-contract.sql` with a second synthetic supervisor assigned only to Balod (LGD block 3629), while the existing supervisor remains assigned only to Dhamtari (LGD block 3625).
- Worker B now creates a synthetic stock-observation report item in their own facility before submitting the report (respecting the worker draft-only item-write policy).
- New assertions require Supervisor B to see exactly the Balod report and its item, not the Dhamtari report or its item; attempts to update the Dhamtari report must affect zero rows, while the assigned Balod report can be verified.
- All test identities, facilities, reports and items are confined to the disposable PostgreSQL CI fixture. The connected Supabase project was queried read-only and remains empty of operational users, facilities, assignments and reports. No live accounts, migrations, Edge Functions or production deployments were created.
- Latest test SQL commits: `08bc5970251ea832f266b0b2f699f62fd97c296c` and `e45e2c049855c3c17f099ad39eb49726b1242ca5`. The second commit also asserts that Supervisor B cannot read Worker A's worker record. CI status for these latest commits is not yet confirmed; the GitHub connector's commit-run lookup returned no PR-triggered run, and Vercel reports only the existing build-rate limit.


## Part 2E.1 — storekeeper fulfilment separation and synthetic receipt lifecycle — 2026-11-07

- Reviewed `app_private.guard_replenishment_transition()` and found that the prior transition guard admitted both supervisors and storekeepers for allocation, dispatch and receipt transitions. This did not preserve the intended separation of duties.
- Added an additive migration `20261107230000_busho_storekeeper_separation.sql`; the original security-foundation migration remains unchanged. The additive guard requires an assigned supervisor for DPDMIS submission after approval and an assigned storekeeper for allocation, dispatch and goods receipts.
- Extended the disposable PostgreSQL contract with a synthetic Balod storekeeper scoped to block LGD 3629. The synthetic supervisor approves and submits a replenishment recommendation; the storekeeper then records allocation, dispatch, a partial receipt and the final receipt.
- Added negative assertions: supervisor cannot allocate; storekeeper cannot read or update the Dhamtari request; over-receipt is rejected; the two receipt events and their external references are preserved.
- All records are synthetic CI fixtures only. Connected Supabase remains unchanged; no live migrations, Auth accounts, facilities, reports, Edge Functions or production deployments were created.
- Latest test SQL blob SHA: `38ed0f01ab2cf9e87dd07203d235192ee6516ae6`. CI has not yet been confirmed for this head.


## Part 2E.2 — invalid transition and immutable event guards — 2026-11-07

- Tightened the additive storekeeper-separation migration so dispatch can only follow the `allocated` state; direct dispatch from `submitted_to_dpdmis` is no longer an allowed transition.
- Added PostgreSQL contract assertions that a storekeeper cannot dispatch before allocation, and cannot update or delete replenishment event rows after they have been recorded.
- Existing synthetic Balod scenario still covers supervisor approval/submission, storekeeper allocation, dispatch, partial receipt, final receipt, over-receipt rejection, receipt reference provenance and cross-facility isolation.
- These are CI fixture assertions only. No live Supabase migration or operational records were changed.
- Latest migration file SHA: `0b0dd840885ff7218e8d28131c124f6b9e5ad9fe`; latest SQL contract file SHA: `fe781341359ca49ac388c042d389d3ee9351a7b2`. CI status for the latest branch head remains unconfirmed.


## Part 2E.3 — immutable inbound inventory movement ledger — 2026-11-07

- Identified that replenishment receipts updated only `replenishment_requests.received_quantity`; they did not create a separate stock movement record.
- Added `inventory_movements`, an append-only inbound-receipt ledger with facility, item, request, positive delta, unit, external goods-receipt reference, data mode, actor and timestamp.
- Added a database trigger that writes exactly the newly received quantity for each partial/final receipt. Receipt movements do not overwrite `inventory_snapshots` and do not imply DPDMIS integration.
- Added a request guard requiring the inventory item to be active, belong to the same facility and use the same unit as the request.
- Authenticated users receive scoped read access only; ledger writes are trigger-owned, not browser-writeable. Added tests for two receipt movements (4 + 6 = 10), provenance, append-only behavior and cross-facility item rejection.
- Updated `supabase-client.js` to include movement rows in inventory and replenishment reads. The current supervisor screen is still a demo/local-state interface; this change exposes server data but does not claim the fulfilment UI is integrated.
- No connected Supabase migration or data writes were performed. CI for this latest code has not yet been confirmed.
- Latest test SQL SHA: `a294dbf5cb8a0c5dd9a8f7fe4f2391d52a05d72f`; movement migration SHA: `c5ea0ce53c6e37d7d8e9b8de4a974e10d0821438`; Supabase client SHA: `c1d6200559435a05bf3a383fa29a74a3a82e6393`.

- Added an RLS contract assertion that a worker cannot browse the inventory movement ledger; only facility operational roles and scoped administrators can read it. Latest SQL contract SHA: `68b3bcfb485f1559cb103f801ac8fc1850b895de`.


## Part 2F.1 — first server-backed storekeeper workspace — 2026-11-07

- Added `storekeeper.html` and `storekeeper-portal.js`. The portal uses the existing Supabase Auth gate and authenticated profile; only an active `storekeeper` role can enter.
- Added the explicit storekeeper role allowlist and workspace label to `role-auth.js`. This closes a portal-auth integration gap: without the allowlist branch, a storekeeper would have been rejected by the supervisor portal's default role list.
- Workspace loads `listMyReplenishments()` (RLS-scoped) and renders request state, item/facility, external references, cumulative receipt quantity, receipt movement history and workflow events.
- Storekeeper actions are state-gated: allocation only from `submitted_to_dpdmis`, dispatch only from `allocated`, receipt only from `dispatched/partially_received`. Cumulative receipt values are checked in the UI and revalidated by PostgreSQL triggers.
- Added an explicit client error when a PATCH returns no row, so an RLS-filtered update cannot be shown as successful.
- Replenishment read query now includes linked inventory item name/unit, event history and movement history.
- Updated CI to apply the storekeeper separation and inventory movement migrations before running the PostgreSQL RLS contract. This is necessary for CI to test the schema actually introduced by this branch.
- No live Supabase migrations, operational rows or production deployments. UI and migration CI verification pending.
- Current file SHAs: storekeeper HTML `acaad14edff07a326a736c0c7862c3c2ef7178f3`, controller `d3263c83e08e24d81adcbb252bc32304511ec8fc`, role auth `ee26a82db3aac7010c3fb13c1970e8fea9181729`, client `416a8d553ab029156092e385f72e9b5e0c0ef0c7`, CI workflow `1510d5b0eaf87140f54dbec3f45153fcd2c7dce4`.


## Part 2F.2 — receipt reconciliation and provenance view — 2026-11-07

- Expanded each storekeeper request with the latest receipt reference, received-to-date and outstanding quantities, linked source report ID and data classification.
- Expanded the receipt movement ledger with explicit column headings and a sum of movement deltas alongside the cumulative receipt quantity on the request. The two totals are displayed for human reconciliation; they are not represented as independently verified physical stock.
- Expanded the request event history with action, state transition, timestamp and external reference.
- UI still depends on database RLS and trigger validation. No local-only fallback or synthetic request generation was added.
- Controller SHA: `29386896a721e5f6c62a768ee7e1d4fbde61e72d`. PostgreSQL CI run for the preceding head was observed in progress; latest head verification still pending.

- CI run `42397275850` exposed a pre-existing malformed PostgreSQL test block delimiter at line 213 (`do $` rather than `do $$`). All three Node-version checks passed; both new migrations applied successfully in PostgreSQL; the database contract stopped at this syntax error before executing the assertions. Fixed the delimiter in the contract file. Re-run pending.

- Follow-up CI run `42397363718` repeated the PostgreSQL syntax error because the first delimiter edit did not persist; re-fetched the branch file and verified exactly one malformed `do $` block remained at line 213, then corrected it directly. Latest test-file commit: `2a30dc541ece54d4de71a67c7c7af98f13002511`; fetched the file again and verified zero malformed delimiters. New CI run pending.


## Part 2F.3 — storekeeper discoverability and role selection — 2026-11-07

- Added Storekeeper as the third role card in `signin.html`, linking to the dedicated authenticated `storekeeper.html` workspace.
- Updated the shared sign-in role grid: three columns on wide desktop, two at intermediate widths and one on mobile. This avoids an unbalanced third card and preserves responsive layout.
- The landing page's general CTA continues to route through the role selector; no privileged portal is exposed directly from the public landing page.
- Verified CI run `42397499407` passed all four jobs (Node 18, 22, 24 and PostgreSQL database contract) on commit `1d59846`, including both new migrations and the complete synthetic RLS/stock workflow contract. This is the first confirmed green DB contract for the storekeeper/receipt-ledger work.
- Latest role selector SHA: `0823ca0edb1d3561639c7b0154039c0ca5553c66`; CSS SHA: `3a2211e3ebbf5318fa54394783031a65556f0d28`. CI for the latest UI commits is pending.
- No live Supabase migration, real user provisioning, or production deployment performed.


## Part 2F.4 — supervisor-to-storekeeper handoff — 2026-11-07

- Added a dedicated Supply handoff module to the authenticated supervisor portal, with navigation entry, refresh, scoped request list and explicit empty/error states.
- The module shows source report, facility, item, requested quantity, approval attribution, DPDMIS reference, allocation/dispatch references and receipt progress.
- Supervisor-only actions: approve a recommendation (database records reviewer identity/time) and record the actual DPDMIS submission reference after external submission. District/state admins can inspect scoped records but the UI does not expose supervisor-only actions to them.
- After every action, the UI reloads the authenticated server list; it does not optimistically claim a successful handoff. Storekeeper sees the request through its existing assigned-facility RLS query only after the supervisor records `submitted_to_dpdmis`.
- Existing PostgreSQL contract covers approval attribution, external DPDMIS reference immutability, assigned facility access and storekeeper-only allocation/dispatch/receipt transitions. New supervisor handoff UI still needs CI and browser E2E verification.
- No schema changes, live DB writes/migrations, user provisioning or production deployment.
- Supervisor page SHA `51683e7b4d6cb385fe6af3734ff28c79d6d99245`; handoff controller SHA `1dcc6038b0e725fa051db70518e45e20f0808615`.

- Part 2F.5 test hardening: added an isolated PostgreSQL negative test proving an assigned storekeeper cannot approve a supervisor recommendation. The fixture is created by the assigned Balod supervisor, attempted by the assigned Balod storekeeper, and rolled back so it does not affect later row-count assertions. Test commit: `0c9c8ce`. CI run not yet returned for this commit.


## Part 2F.5 — role-boundary and receipt-retry contract hardening — 2026-11-07

- CI run `42399718046` passed Node 18/22/24 but failed the PostgreSQL contract at the new storekeeper-negative test: it attempted to create a replenishment request from Supervisor B's report before that report was supervisor-verified. The database correctly rejected the insert. This was a test ordering/fixture defect, not a production authorization defect.
- Moved the rollback-isolated storekeeper-cannot-approve test to after Supervisor B's report verification and before the normal Balod recommendation fixture. Re-fetched the file and confirmed it is after the verified-report marker and before the regular request creation.
- Added a PostgreSQL idempotency assertion: replaying the final receipt update with the same cumulative quantity and receipt reference must leave the inventory movement count at two and receipt-event count at two. This directly tests retry safety at the database boundary.
- Test commit: `f17a63e`. CI for this latest head not yet returned.
- No schema changes, live Supabase migrations, real data writes or production deployment.


## Part 2F.6 — idempotent receipt retry semantics — 2026-11-07

- CI run `42399916427` passed Node 18/22/24 but the PostgreSQL contract failed at the exact-retry test. The request trigger rejected the repeated unchanged final receipt as an invalid transition. The movement ledger correctly did not duplicate, but the API retry surfaced as failure.
- Updated the existing replenishment transition guard: after verifying assigned supervisor/storekeeper facility access, an assigned storekeeper may replay an exact receipt state/quantity/reference for an already partially or fully received request. This returns the unchanged row; it does not change quantity/reference and therefore does not fire a new receipt movement. Changed references, changed quantities and other state transitions remain guarded.
- Added a direct test inside the storekeeper RLS transaction: repeat the exact final receipt update, then assert exactly two receipt movements and two receipt events remain.
- Latest migration commit `3590261`; latest test commit `40ad6d4`. CI not yet returned for these commits.
- No live Supabase migration, production deployment or real operational data change.

- CI run `42400122621` passed Node 18/22/24 but failed the PostgreSQL contract because the new retry assertion was inserted in a fixture transaction before the normal Balod request had been created/received; it therefore saw zero movements/events. The database was correctly enforcing transaction isolation. Moved the retry assertion into the existing storekeeper transaction immediately after the actual partial and final receipt operations, before the transaction closes. Latest contract commit `8cda6d1`; re-fetched file to confirm the assertion is inside the real receipt flow. CI pending.

- CI run `42400418038` passed Node 18/22/24 but PostgreSQL failed at the later storekeeper scope assertion (expected one Balod request, got two). The negative approval fixture had not been rolled back. Added and re-fetched an explicit `ROLLBACK` immediately after the negative test, before the normal Balod recommendation is created. Latest test commit `d4b6ba0`; CI for this exact head not yet returned.

- CI run `42400643712` passed Node 18/22/24 but PostgreSQL failed at the exact receipt replay with "This indent transition is not allowed". The retry guard already required exact same status, cumulative quantity and receipt reference after assigned facility-role authorization, but also unnecessarily restricted it to the storekeeper role. Removed only that extra role restriction: either assigned supervisor or assigned storekeeper may replay an exact unchanged receipt; any changed field still follows the existing transition guard. Migration fix commit `1e9b778`; CI pending.

- CI run `42401141797` passed Node 18/22/24 but PostgreSQL failed at the storekeeper workflow because the database transition guard allowed an assigned supervisor to execute storekeeper-only allocation/dispatch/receipt transitions. This exposed a real authorization gap, not merely a test issue. Fixed the guard so allocation, dispatch and receipt explicitly require `v_role = 'storekeeper'`; supervisor recommendation/approval/submission remain supervisor-only, and exact no-op receipt retry still passes through facility authorization. Migration commit `99c2740`; CI pending.


## Part 2G.1 — evidence-based inventory reconciliation view — 2026-11-08

- Added a storekeeper-only Inventory reconciliation section to `storekeeper.html` and a dedicated controller `storekeeper-inventory-reconciliation.js`.
- Uses existing authenticated `listInventory()` query, which retrieves facility-RLS-scoped active inventory items with their observations and inbound movement ledger. No new table or schema migration was introduced.
- For each item, the view separately displays latest dated observation, observation source/freshness, inbound receipt movement count/total, receipt references and recent observation history. It marks synthetic evidence where present.
- Explicitly does not compute or label a current balance: the current model has no verified opening-balance baseline and no complete outbound movement ledger. It also does not claim physical verification.
- Existing live Supabase schema inspection confirmed `inventory_items` and `inventory_snapshots` are empty, RLS-enabled tables; live project has no `inventory_movements` table yet because branch migrations have not been applied. No live DB changes.
- HTML commit `0b0bb07`, controller `9f85932`, script include `c34fbb8`. New feature still needs CI/browser E2E verification.
- PostgreSQL CI on diagnostic commit `8ae995a` still failed at the storekeeper contract. Diagnostic notices show allocation, dispatch, partial receipt, final receipt and exact retry were all reached before the exception; the failure is in the later cross-facility update attempt. Reworked that assertion to accept either RLS zero-row filtering or a trigger rejection, while verifying the Dhamtari request remains unchanged. Latest test commit `6878072`; CI pending.


## Part 2F.8 — final transition guard retry fix — 2026-11-08

- Root cause of the repeated receipt retry failure: CI applies `20261107230000_busho_storekeeper_separation.sql` after the earlier operational security migration. That later migration replaces `app_private.guard_replenishment_transition()`, so fixes made only to the earlier function were overwritten during the actual CI migration sequence.
- Corrected the final, effective guard in `20261107230000_busho_storekeeper_separation.sql`: after assigned supervisor/storekeeper facility authorization, an assigned storekeeper may replay an exact unchanged partial/final receipt (same status, cumulative quantity and receipt reference). Any changed receipt data still follows the guarded transition; movement trigger remains a no-op for exact replay.
- Removed temporary diagnostic notice from the earlier migration. No schema changes beyond the guard logic; no live migration.
- Latest code commits: `4360ba9` (effective final guard), `c3e865d` (remove temporary diagnostic). Latest CI for the corrected effective migration still needs confirmation; prior run `42403999433` failed because it applied the later migration that overwrote the earlier retry logic.


## Part 2G.2 — immutable inventory movement ledger permissions — 2026-11-08

- CI run `42404742567` passed Node 18/22/24 and the PostgreSQL contract advanced through cross-facility checks, but exposed a genuine ledger-write privilege gap: authenticated storekeeper could UPDATE `inventory_movements` despite the intended append-only design.
- Updated `20261107233000_busho_inventory_movement_ledger.sql` to explicitly revoke all table privileges from PUBLIC, anon and authenticated, then grant authenticated SELECT only. The receipt trigger remains SECURITY DEFINER; service_role receives explicit CRUD only when that role exists in the target environment.
- Existing PostgreSQL contract already attempts to mutate an inbound movement and expects rejection. This should now fail closed at the privilege boundary.
- Migration commit `e2031d4`; CI pending. No live migration or production change.

- Follow-up CI `42404846423` showed the immutability assertion itself was running as the privileged test owner, not as `authenticated`; the UPDATE therefore succeeded because the test was not exercising the intended role. Moved UPDATE/DELETE attempts into a dedicated transaction with `SET LOCAL ROLE authenticated`, while preserving the read-only owner audit separately. Latest test commits `bda18ee` then `56b32d5` (removed redundant COMMIT after ROLLBACK). CI pending.


## Part 2G.2 — CI green and remaining release gates — 2026-11-08

- CI run `42405025347` for test commit `56b32d5` completed successfully: Node 18, Node 22, Node 24 and PostgreSQL 17 database contract all passed.
- The PostgreSQL contract now tests cross-facility immutability outside the restricted storekeeper RLS context (the storekeeper cannot see the other facility row, so the unchanged-row assertion is made by the privileged audit after role reset). It separately attempts movement UPDATE and DELETE inside an authenticated transaction, so the append-only permission test exercises the correct role.
- The inventory ledger migration explicitly revokes browser writes and grants authenticated SELECT only; receipt creation is via SECURITY DEFINER trigger.
- Latest source/test CI is green. A documentation update follows; CI must be checked again for the final documentation head if it changes workflow-triggered checks.

### Remaining work / gates
1. Browser E2E: worker → supervisor → storekeeper on separate approved test accounts and facilities; preview URL must be for the current feature head. Current recent Vercel READY preview is on an older commit; no deployment for latest head verified.
2. Live Supabase migration: requires explicit release approval; current live project has not received branch migrations, has zero operational users/facilities/items, and must not be populated with guessed real records.
3. Admin provisioning: requires verified facility master and authorized real administrators; no public signup or self-promotion.
4. Facility registry: obtain dated authoritative Chhattisgarh DHS/NHM/CGMSC roster and human-review candidate mappings; current public sources are insufficient for safe assignment.
5. Medicine catalogue: pharmacist/CGMSC-authorized human review of all 278 source rows against rendered EDL PDF, footnotes, restrictions, applicability and item coding. Transcription/structure is not clinical approval.
6. Stock accounting: define authorized opening balances, outbound/adjustment/transfer movements, count variance approvals and stocktake workflow before calculating current stock. Current UI is evidence-only.
7. Production release: owner approval, migration backup/rollback plan, secret/RLS review, verified E2E, monitoring and release notes; production branch remains unchanged.
8. PR #5 remains draft/open; merge only after gates above and owner review.

No live Supabase changes, real user provisioning, operational data entry, production deployment or PR merge.


## Part 2G.3 — demo workflow authorization parity — 2026-11-08

- Cross-checked the pure JavaScript demo state machine against the final PostgreSQL transition trigger and found role drift: the demo had allowed supervisors to allocate, dispatch and receive, and had allowed storekeepers to submit DPDMIS references. The database correctly requires supervisor approval/submission and storekeeper allocation/dispatch/receipt.
- Updated `workflow-core.js` transition table to match database authorization: supervisor-only approval and DPDMIS submission; storekeeper-only allocation, dispatch and receipt; clarification returns remain available to assigned supervisor/storekeeper. Removed the invalid direct submitted-to-dispatched path.
- Rewrote the operational workflow test to assert both permitted and denied role transitions. Corrected partial/final receipt test actors to storekeeper.
- Added four controller tests for inventory evidence rendering, role gate, invalid timestamps and read errors; initial test harness was adjusted to model the HTML's server-rendered sign-in empty state.
- Stock accounting design gate documented in `docs/stock-accounting-design.md`; current UI remains evidence-only pending local SOP/authority decisions.
- Latest workflow/test commits `4bb766f`, `0480662`, `be21f7b`; CI for final head pending.


## Part 2G.4 — authorization parity, idempotency and preview smoke — 2026-11-08

- Aligned `workflow-core.js` with database authority: indent recommendation creation is supervisor-only; supervisor approves and records DPDMIS submission; storekeeper records allocation, dispatch and receipts. Removed direct submitted-to-dispatched transition. Added a safe exact receipt retry no-op for storekeeper only, matching an already recorded reference + quantity; no duplicate event is appended.
- Added tests that storekeepers cannot create recommendations, supervisors cannot allocate/dispatch/receive, storekeepers can perform fulfilment, over-receipt is rejected, and exact receipt replay is idempotent. Corrected partial/final receipt test actors to storekeeper.
- Added four focused Storekeeper inventory UI controller tests covering safe HTML escaping, scoped role gate, invalid timestamps and read errors. CI run `42405853347` passed all Node 18/22/24 and PostgreSQL 17 jobs after fixing the test harness to model the HTML server-rendered sign-in state.
- CI run `42406238309` passed all four jobs for role separation and inventory tests. A later CI run for the additional pure-state-machine idempotency tests is `42407315798`; Node 18/22/24 passed, PostgreSQL contract was still running at this note.
- Found and corrected stale asset query versions in worker, supervisor and admin HTML: browser cache keys now point to current Supabase client, role-auth, app, and admin scripts.
- Created Vercel preview deployment for commit `fd45ef3`: READY. HTTP smoke check returned 200 for landing, worker, supervisor, storekeeper and admin pages; the storekeeper page's script/style assets all returned 200. This deployment predates the last pure-state-machine retry adjustment and final asset cache-key edits, so a fresh preview is required for the final head.
- Added `docs/stock-accounting-design.md` describing the candidate ledger invariant, required event provenance and controls, and explicit local authority decisions required before balance calculations. No unapproved stock ledger schema or live balance engine was invented.
- No live Supabase migration, operational account provisioning, production deployment, or PR merge.


## Part 2G.5 — final engineering checkpoint — 2026-11-08

- CI run `42407415114` for documentation head `389e142` passed all four jobs: Node 18, Node 22, Node 24 and PostgreSQL 17 database contract. The added workflow-core authorization parity, receipt replay no-op, storekeeper inventory controller tests and prior RLS/migration assertions are green.
- Preview `busho-1bdlll948-saturn-789b.vercel.app` for `fd45ef3` was READY and its landing, worker, supervisor, storekeeper and admin HTML pages returned HTTP 200; assets checked for the storekeeper page also returned 200. It predates the last asset-cache-busting and pure state-machine retry commits.
- Attempt to create a preview for current branch head `389e142` was rejected by Vercel with HTTP 402: free API deployments limit exceeded (retry after 24 hours). No plan/billing setting changed. The existing preview is not represented as the latest build.
- Latest engineering work is committed on the feature branch. The final PR documentation commit will trigger another CI run.

### Non-engineering / owner-gated blockers that cannot be fabricated
1. **Live Auth test identities and browser workflow:** create approved synthetic worker, supervisor and storekeeper accounts with separate facility scopes in a non-production Supabase environment. No test credentials were provided and no live users were created. CI exercises DB RLS with synthetic auth identities; it is not a browser session test.
2. **Facility registry:** obtain a dated official Chhattisgarh DHS/NHM/CGMSC facility master and local verification of LGD/facility mappings. Existing candidate data is not assignable.
3. **EDL clinical/catalogue review:** an authorized pharmacist/CGMSC reviewer must complete and sign the 278-row review template. Engineering cannot self-certify clinical content.
4. **Stock accounting SOP:** obtain competent-authority decisions listed in `docs/stock-accounting-design.md` before implementing opening balances, outbound issues, transfers, adjustments or a balance engine.
5. **Live migration/release:** require owner approval, migration rehearsal, backup/rollback plan, approved data, real user provisioning, security review and monitoring. Live Supabase and production remain untouched; PR #5 remains draft/open.


## Part 2G.6 — final state-machine retry edge case and green CI — 2026-11-08

- Tightened exact receipt retry semantics one more step: the demo state machine now accepts only a replay of the *latest* recorded receipt reference and its exact quantity, matching the SQL row's current receipt reference. An older partial receipt reference cannot be replayed after a later final receipt.
- Confirmed indent recommendation creation is supervisor-only in the demo state machine, matching the database INSERT guard.
- Added tests for storekeeper-denied indent creation, supervisor-denied allocation/dispatch/receipt, storekeeper fulfilment, over-receipt rejection, exact retry no-op, and rejection of a superseded partial receipt retry.
- Latest code/test CI run `42407616983` passed all four jobs: Node 18, Node 22, Node 24 and PostgreSQL 17 database contract.
- Latest source head at the time of this note is `ef0e93a`; documentation update follows and will trigger a final CI run.

### Explicitly not completed because external approvals/resources are missing
- Browser E2E with real authenticated worker/supervisor/storekeeper sessions: no approved non-production Auth test identities or test Supabase branch were supplied/created. The PostgreSQL RLS contract exercises synthetic identities, and controller tests exercise UI behavior, but neither substitutes for live browser sessions.
- Fresh Vercel preview for final head: Vercel returned HTTP 402 because the free API deployments/day limit was exceeded; the previous READY preview was on an earlier feature commit. Retry after 24 hours or resolve the team's deployment limit. No billing change made.
- Current authoritative Chhattisgarh facility master and human-reviewed LGD/facility mapping.
- Signed pharmacist/CGMSC review of all 278 EDL rows.
- Competent-authority approval of stock accounting SOP and role/approval matrix.
- Owner-approved live migration, Auth provisioning, monitoring and production release.

No live Supabase migration, operational account creation, real facility/medicine assignment, production deployment or PR merge was performed.


## Part 2H.1 — authenticated portal integration demo harness — 2026-11-08

### Delivered
- Added `tests/authenticated-portal-demo.test.cjs`, which runs the actual browser Supabase client, portal role policy and portal Auth gate together inside an isolated VM browser harness.
- The harness exercises password sign-in through the Supabase Auth token endpoint, server-controlled profile lookup, role gate, authenticated event dispatch, workspace visibility, password field clearing, sign-out and unauthenticated event dispatch.
- Added explicit denial cases for a valid supervisor account attempting the worker portal, a pending worker profile and a missing profile. No production or live Supabase credentials are used; all identities/tokens are synthetic fixtures and the fetch layer is deterministic.
- Corrected harness-only DOM fidelity issues discovered by CI (submit control reference and focus behavior). No application runtime code changes were required for these test failures.
- Latest CI run `42408884855` passed all four jobs: Node 18, Node 22, Node 24 and PostgreSQL 17 database contract.

### Scope and limitation
- This is a real-code integration test for the browser Auth client and role gate, not a live authenticated multi-browser E2E against Supabase. The latter still needs an approved non-production project and administrator-created test identities with verified facility assignments.
- No password or token has been created in the live project. No Supabase migration, Edge Function deployment, live provisioning, or production change was performed.

### Next within Part 2H
1. Add equivalent integration coverage for administrator provisioning UI + server policy using mocked server responses, including scope-denial and unverified-facility cases.
2. Add end-to-end worker report submission and supervisor review controller integration against deterministic Supabase REST fixtures, preserving the live RLS contract tests.
3. Once approved non-production Auth identities/facilities exist, run true multi-user browser E2E and record evidence before release review.


## Part 2H.2 — authenticated portal and admin provisioning demo tests — 2026-11-08

- Added `tests/authenticated-portal-demo.test.cjs`: executes the actual `supabase-client.js`, `portal-auth-policy.js` and `role-auth.js` together in an isolated browser-like VM. It covers synthetic password sign-in, profile lookup, correct worker/supervisor/storekeeper role access, authenticated event, workspace visibility, password clearing, sign-out and unauthenticated event; wrong-role, pending and missing profiles are denied.
- Added `tests/admin-provisioning-demo.test.cjs`: executes the actual administrator provisioning controller with an empty verified facility/district directory. It verifies worker invitations are disabled and defensively blocked on submit, and that a state admin receives no invented district/facility options or selectable unassignable roles.
- Harness failures exposed incomplete DOM test doubles and an incorrect assumption about the platform-admin default role; fixed the test harness/expectations without weakening application policy.
- CI run `42409286439` passed all four jobs: Node 18, Node 22, Node 24 and PostgreSQL 17 database contract.
- This is deterministic application integration coverage with synthetic Auth/REST fixtures, not a live multi-user browser test. It does not provision users or alter Supabase.

### Next Part 2H.3
- Add positive-path admin provisioning controller test with a verified facility fixture, including required worker consent and exactly-one-facility behavior.
- Add REST-contract integration tests for worker report draft → item persistence → submission and supervisor review/correction, using deterministic mocked HTTP responses while preserving database RLS tests.
- After approval of a non-production Supabase environment and synthetic test accounts/facilities, run real browser E2E and record screenshots/log evidence.


## Part 2H.3 — administrator provisioning positive-path UI test — 2026-11-08

- Extended `tests/admin-provisioning-demo.test.cjs` to execute the actual admin controller with one explicitly verified synthetic facility fixture. It verifies the worker role becomes selectable only when a verified facility exists, the UI submits exactly one facility ID, worker consent is passed as true, and the success message is visible.
- Negative-path coverage also asserts worker role is disabled and server invocation is never attempted when the verified facility list is empty; a forced stale/disabled role value is rejected again by the submit handler. State-admin UI with an empty directory gets only the district placeholder and all facility/district-dependent roles remain disabled.
- The positive-path integration test exposed a real UI bug: the invitation success message was immediately cleared by `updateRoleSections()`. Fixed the ordering in `admin-portal.js` and bumped its cache key in `admin.html`.
- CI run `42409576022` passed all four jobs: Node 18, Node 22, Node 24 and PostgreSQL 17. Node matrix reports 166 tests passed, zero failed, and smoke test starts successfully.
- No invitation was sent; the UI test uses a deterministic mocked client and synthetic facility fixture only.

### Part 2H.4 next
- Build deterministic REST contract integration tests for worker report draft → structured items → submit acknowledgement and supervisor review/correction. Assert authorization headers, server-controlled facility IDs, idempotent retries, and truthful failure states.
- Then run browser-level multi-user E2E only after an approved non-production Supabase environment and synthetic accounts/facility assignments are available.


## Part 2H.4 — worker submission and supervisor review REST integration — 2026-11-08

- Added `tests/report-submission-rest-integration.test.cjs`, exercising the real `supabase-client.js` and `report-persistence.js` together against deterministic mocked Supabase Auth/REST endpoints.
- Worker flow test covers password authentication, server-controlled profile lookup, worker record lookup, draft creation using the worker's assigned facility and worker ID, structured report item persistence with review-required/source-phrase metadata, server acknowledgement failure, local report-ID checkpoint, safe retry of the same draft, replacement of the same item set, and final submitted acknowledgement. It asserts exactly one report was created and the retry did not duplicate the report.
- Supervisor flow test covers authenticated supervisor role lookup, mandatory reason for correction request (no PATCH is sent without it), and authorized correction status + review note PATCH with the supervisor bearer token.
- CI run `42409856667` passed Node 18/22/24 and PostgreSQL 17 database contract. Node matrix: 168 tests, 168 passed, zero failed.
- This is application/REST contract integration with deterministic fixtures; database RLS remains separately exercised by PostgreSQL CI. It is not a real browser session or live Supabase integration test.

### Remaining Part 2H.5 release-validation gate
- True multi-user browser E2E still needs a separately approved non-production Supabase environment, synthetic accounts, verified test facility assignments and an available Vercel preview deployment quota. Do not create these in the live project or use real health worker/patient information.


### Part 2H.5 — isolated authenticated demonstration plan and supervisor legacy-engine fix — 2026-11-08
- Added `docs/part-2h5-authenticated-demo-plan.md` defining approved non-production environment options, synthetic two-facility/two-role fixtures, positive and negative role/RLS acceptance tests, evidence requirements and exit criteria. Commit: `0df2c504`.
- Refreshed this progress file with live GitHub/Vercel/Supabase checkpoint data. Commit: `47d8b989`.
- Audited the READY preview HTML and identified a real supervisor-page isolation defect: `app-v2.js` is the legacy worker/synthetic demo state machine, but was still loaded by `supervisor.html`. It can activate the legacy hidden supervisor panel and mutate hard-coded demo metrics when the authenticated event fires, despite the separate RLS-backed supervisor controller.
- Removed `app-v2.js` from `supervisor.html`; worker page continues to load it. Added a regression test in `tests/supervisor-portal-integration.test.cjs` proving the supervisor page does not load the legacy state machine while retaining the dedicated supervisor controller. Commits: `619a6b1`, `0c86eea`.
- No Supabase branch/project, Auth user, facility, operational row, migration, Edge Function or production setting was created or changed.
- Next: wait for CI on the new head; if green, verify Vercel deploys that exact SHA and smoke-check supervisor HTML/JS/CSS; then inspect other role pages for legacy worker/demo script leakage before beginning approved isolated browser E2E.


### Part 2H.6 — administrator-provisioned storekeeper accounts — 2026-11-08
- Found a provisioning gap: the database role and facility assignment schema, role-auth gate and storekeeper portal supported `storekeeper`, but the admin invitation UI and server-side provisioning policy allowed only worker/supervisor/admin roles. This prevented the intended supervisor-to-storekeeper workflow from onboarding its storekeeper persona.
- Added `storekeeper` to the server-side provisionable role set and to state/district/platform administrator provisioning hierarchy. It follows facility assignment validation (active, verified, non-synthetic Chhattisgarh facility, within caller scope), with no worker-consent requirement and no `workers` cadre row created. The account receives the `storekeeper` profile role and `user_facility_assignments.assignment_role='storekeeper'`.
- Added storekeeper selection and facility assignment to the admin UI, with no storekeeper invitation when there are no verified facilities. Added UI and provisioning-service tests asserting facility assignment, role and absence of worker record.
- Commits: `9c51149` (server policy), `97a6f79` (admin UI), `c420686` (UI test), `4d41b8b` (service test), `91af3d1` (admin hierarchy fix).
- CI run for the initial Part 2H.6 head was observed in progress; the preview deployment for the latest pre-cache-bump head was READY. A deployment smoke check confirmed admin-portal.js contains the storekeeper role/hierarchy and storekeeper portal route/assets return HTTP 200. The admin HTML script cache key was bumped from v6 to v7 to ensure browsers fetch the new provisioning UI; this latest cache-bump commit still needs CI/preview verification. No invitations were sent; no Auth users, facilities or live data were created; no Edge Function deployed; no Supabase migration or production change.
- Next: verify tests and CI; inspect admin provisioning's facility-role semantics and confirm server-side role/facility scope checks; audit remaining operational pages and continue toward isolated browser E2E.

- Follow-up: bumped the admin portal script URL to `admin-portal.js?v=7` in `admin.html` so clients do not retain a cached pre-storekeeper provisioning bundle. Commit `0c31d56`. Latest-head CI and Vercel deployment verification pending.

- CI exposed two stale assertions in `tests/admin-portal-integration.test.cjs` that encoded the old provisioning hierarchy and worker/supervisor-only facility payload. Updated those assertions and added a focused storekeeper contract check. The storekeeper UI/service tests are also present. Latest CI run `42449804731` is queued for commit `a7eb514`; earlier run `42449662069` failed only the Node test matrix on those two stale assertions while PostgreSQL 17 RLS migration/contract job passed. Await latest run before calling this milestone green.

### Part 2H.7 — remove legacy synthetic supervisor workspace — 2026-11-08
- Preview source audit found that supervisor.html still embedded a legacy worker panel and a full synthetic supervisor dashboard (Rampur HWC, +38% fever trend, static report counts, stock quantities and inventory cards) inside the authenticated supervisor app shell. Removing app-v2.js did not remove these static HTML contents; this was a demo-integrity issue.
- Removed the entire legacy overview-content block (worker and supervisor demo panels), the fabricated Rampur facility context and demo session label. The authenticated workspace now presents only the scoped supervisor modules and identifies its access scope as resolved from the authenticated account.
- Added a regression test asserting the authenticated supervisor page contains no legacy worker/supervisor panels or fabricated facility, trend and stock values.
- Commits: 5ae418a (HTML cleanup), 90fb09e (regression test).
- Verification: fetched latest READY preview for commit 5ae418a; /supervisor.html and the three operational JS assets returned HTTP 200. Preview HTML no longer contains Rampur HWC, the legacy worker panel or legacy overview block. CI run 42450049101 for the HTML commit was queued at last check; test commit 90fb09e was still deploying. Do not mark the milestone CI-green until the latest-head CI result is complete.
- No production changes, live migrations, invitations, facility records or Edge Function deployments were made.
- Next: verify latest-head CI and preview; inspect the supervisor/storekeeper supply handoff against the current page shell; then proceed to isolated authenticated browser E2E only after a non-production environment choice is approved.
- CI follow-up: the first regression-test commit correctly triggered the smoke check to catch a stale assertion that expected the worker report composer on both worker and supervisor pages. Updated scripts/smoke.mjs so the worker page must expose the report live-status node while the supervisor page must not embed that worker composer. Commit 909dfdb. Latest preview for 909dfdb is READY and confirms supervisor HTML no longer contains legacy synthetic content or worker composer; worker route remains HTTP 200. CI run 42450104368 was queued at last check; await completion before marking this milestone green.
### Part 2H.8 — prevent accidental full-quantity receipt posting — 2026-11-08
- Storekeeper UI review found the cumulative receipt quantity input defaulted to the entire requested quantity. A user could submit a receipt without entering or verifying the actual received quantity, unintentionally recording a full receipt and triggering an inbound inventory movement.
- Changed the quantity input to start blank with an explicit cumulative-quantity placeholder. Existing client and database validation still require a quantity greater than the prior cumulative total and no greater than the request, plus a non-empty external goods-receipt reference.
- Added tests to assert that the receipt field remains blank by default and that cumulative bounds and external reference requirements remain enforced. Commit c933487.
- No live stock movements or receipts were created. Await CI and preview verification for this fix.
### Part 2H.9 — local Supabase E2E foundation — 2026-11-08
- Added a reproducible local Supabase configuration at supabase/config.toml, with local-only Auth and service ports; no remote project link or production secrets are configured.
- Added a first migration that reconstructs the legacy application schema needed by the existing additive BUSHO migrations. The baseline is idempotent against the existing PostgreSQL CI bootstrap, and CI now applies it before the operational security migrations.
- Added scripts/local-supabase-auth-smoke.mjs and npm run local:e2e. It uses the local Supabase Auth admin API and PostgREST, creates four temporary synthetic accounts across two synthetic facilities, verifies password login and auth-triggered profiles, facility isolation, worker report draft/submission, same-facility supervisor verification, cross-facility isolation, and anonymous profile access denial. Test records are cleaned up in finally.
- Added docs/local-supabase-e2e.md with prerequisites, PowerShell and shell setup, run command, and explicit prohibition on linking/pushing/resetting a remote project.
- Key commits: cd694d4 (baseline draft), e145b4e (idempotent baseline), 8127b3a (CI baseline step), 3a38d3c (local Supabase config), 6b81fe9 (API-key/auth-token correction), d82dac9 (report lifecycle checks), 9861171 (runbook).
- Verification limitation: no Docker/Supabase CLI execution has been performed in this hosted coding session. This is implementation of the reproducible local test path, not proof that the local stack has started or that the new Auth/PostgREST smoke test passes. CI's PostgreSQL migration contract is the immediate automated validation; run npm run local:e2e on a developer machine with Docker and Supabase CLI before declaring local E2E passed.
- No production migrations, live users, facility records, inventory, Edge Functions, Supabase branches, or Vercel production deployment were changed.
- Final CI hardening: added a Node syntax check for the standalone local E2E runner to npm run check (commit d41433f). The latest preview for this commit is READY: https://busho-1ethuvfi4-saturn-789b.vercel.app. CI run 42450480580 is running across Node 18/22/24 and PostgreSQL 17; do not claim latest-head green until it completes.
### Part 2H.9 — local Supabase multi-user E2E executed — 2026-11-08
- Developer-reported Windows execution of `npm run local:e2e` against the local Supabase stack completed successfully: 10/10 assertions passed.
- Verified local Auth health; four synthetic users created and password-authenticated; auth-triggered profile provisioning; worker/supervisor facility isolation across two synthetic facilities; worker draft creation and draft privacy before submission; same-facility supervisor visibility after submission; worker submission and supervisor verification transitions; cross-facility report isolation; anonymous profile access denied by RLS.
- Evidence is the user's pasted terminal output from Node.js 24.18.0, Supabase CLI 3.0.0, local Supabase/PostgreSQL 17 on Windows with Docker Desktop. This is local API/Auth/PostgREST integration evidence, not browser E2E or hosted non-production validation.
- Follow-up before expanding test scope: verify local test cleanup left no synthetic records/users, then add negative role/action checks and the storekeeper receipt workflow. Do not promote this local result as production readiness.
- No live Supabase project, production data, Vercel production deployment, or operational accounts were changed.

### Part 2H.9 follow-up — immutable local E2E fixture retention — 2026-11-08
- Local developer execution confirmed all 10 Auth/PostgREST workflow and RLS assertions pass, but cleanup attempted to delete a report whose report_events history is intentionally append-only. The database trigger report_events_no_update_delete correctly rejects deletion, including a cascading report delete. The failed cascade consequently leaves the report, worker, facility and some Auth-user references intact.
- Confirmed service_role has BYPASSRLS and DELETE/SELECT privileges on reports, workers, facilities and user assignments. The issue is not missing grants or RLS. It is the append-only event-history invariant and restrictive report/Auth references.
- Decision: do not weaken or disable the append-only trigger for test convenience. The local E2E runner now retains uniquely marked synthetic fixtures per run and reports their run suffix; report marker includes the suffix to make runs distinguishable. A fully clean local database can be recreated with `npx supabase db reset`, but only when the developer explicitly accepts clearing all local database data. This command must never be run against a linked/remote project.
- Earlier cleanup attempts left synthetic fixtures in the developer's local database. They are not production data. They can be removed by a deliberate local reset after confirming no other local data needs preservation.
- The latest local run again passed all 10 workflow assertions; cleanup failure provided direct evidence that immutable workflow history is functioning as designed. Re-run the revised runner once pulled to confirm it exits successfully while reporting retained fixtures.
- No remote Supabase data, production deployment, migration or PR merge was changed.

### Part 2H.10 — local negative authorization and storekeeper fulfilment E2E — 2026-11-08
- Extended scripts/local-supabase-auth-smoke.mjs with real local Auth/PostgREST negative-path and fulfilment checks, using the existing two synthetic facilities and adding assigned storekeeper identities.
- Added database-backed assertions that workers cannot verify their own reports; cross-facility supervisors cannot review reports; storekeepers cannot create supervisor indent recommendations or review reports; supervisors cannot allocate; and an unassigned storekeeper cannot update another facility's indent.
- Added a complete synthetic indent path: assigned supervisor creates recommendation linked to verified report, approves it and records DPDMIS reference; assigned storekeeper allocates and dispatches with external references; missing receipt reference and over-receipt are rejected; partial (12) and final (18) receipt deltas create two ledger movements that reconcile to 30; exact receipt retry does not duplicate movements.
- The tests exercise local Supabase Auth, RLS, database transition triggers, constraints and receipt ledger trigger. All data is synthetic_demo; no live stock or external DPDMIS transaction is created. Fixture retention remains intentional due immutable workflow event history.
- Commits: bb18e7f (expanded tests), 54dd2b9 (assert database trigger denials accurately). Developer must pull and run npm run local:e2e to produce execution evidence; this hosted session cannot access the developer's Docker/local Supabase stack. Do not call Part 2H.10 passed until that local run succeeds.
- No remote Supabase project, live migration, production deployment or PR merge was changed.

### Part 2H.10 — local end-to-end execution verified — 2026-11-08
- Developer pulled feature branch through commit `b9883a1` and executed `npm run local:e2e` against the local Supabase stack.
- Result: all 18 PASS assertions completed, including Auth/profile provisioning, facility isolation, report lifecycle and negative authorization, supervisor-to-storekeeper indent workflow, allocation/dispatch, invalid receipt rejection, partial/final receipt movement reconciliation (12 + 18 = 30), idempotent retry, and anonymous profile RLS denial.
- The runner intentionally retained the six synthetic Auth users, two synthetic facilities and report/event history for run `0ef7d21c`; this is expected because workflow event history is append-only. The runner completed successfully and printed no cleanup failure.
- Verified locally by developer-provided terminal output; this is local test evidence, not a hosted CI run or production verification.
- No production Supabase project, live data, deployment or PR merge was changed.

### Part 2H.11 — inventory ledger integrity and replenishment audit tests authored — 2026-11-08
- Added local E2E coverage for inventory movement visibility scoped by facility and role; direct authenticated insert/update/delete attempts against the movement ledger; immutable replenishment request fields; backward transition rejection after completed receipt; replenishment event-history status coverage and receipt-delta reconciliation; and duplicate external receipt reference rejection.
- Duplicate-reference test creates a second synthetic indent, performs a first partial receipt, then attempts a second receipt with the same reference. It verifies the failed movement insert rolls back the parent replenishment update and leaves exactly one movement.
- The immutable requested-quantity test accepts either a column-level permission denial or a database immutable-field trigger rejection. Current authenticated column grants may reject the write before the trigger, which is still a valid denial but does not independently prove trigger execution.
- New tests are authored but not yet executed by the developer against local Supabase. Do not mark Part 2H.11 passed until terminal output confirms success. All test data is synthetic_demo; append-only history remains retained. No production data, remote migration, deployment or PR merge was changed.

### Part 2H.11 — inventory ledger integrity and replenishment audit E2E verified — 2026-11-08
- Developer pulled branch through `aed498c` and ran `npm run local:e2e` against local Supabase.
- Result: all 23 PASS assertions completed. Newly verified checks include facility/role-scoped movement visibility, authenticated direct ledger insert/update/delete denial, immutable indent fields, backward transition rejection, append-only replenishment event history and receipt-delta reconciliation, and atomic rejection of duplicate external receipt references.
- The duplicate-reference test confirmed the failed second receipt did not change the prior received quantity or create a second movement. The run retained six synthetic Auth users, two synthetic facilities and immutable workflow history under run `66c8e5e8` as intended.
- Evidence is developer-provided local terminal output, not hosted CI or production verification. No remote Supabase project, live data, deployment or PR merge was changed.

### Part 2H.12 — security and access-lifecycle E2E tests authored — 2026-11-08
- Added tests for self-service profile role escalation, cross-facility assignment injection, assignment role tampering and assignment deletion. These must be denied to ordinary authenticated users.
- Added an administrative revocation lifecycle test: revoke a storekeeper's facility assignment while their access token remains valid, verify facility ledger access disappears immediately, restore the assignment and verify access returns; then suspend the profile and verify facility and ledger access disappear despite the same token.
- Added inventory reference-data and snapshot controls: operational users cannot write inventory catalogue rows; workers cannot forge another worker as snapshot observer or label their own snapshot as a storekeeper count; an assigned storekeeper can submit a scoped storekeeper count.
- Added authenticated attempts to update/delete replenishment event history; both must be denied.
- These checks are committed but not yet executed against the developer's local Supabase. Expected outcomes are hypotheses until confirmed by terminal output. If a test fails, inspect actual policy/grant behaviour before changing schema. No production or remote database changes were made.

### Part 2H.12 — inventory snapshot source-role gap identified and patched — 2026-11-08
- Developer's local E2E run stopped at the assertion that a worker cannot label their own snapshot as `storekeeper_count`. The request was accepted, demonstrating a real authorization-policy gap rather than a test-only issue.
- Root cause: the previous `inventory_snapshots_worker_insert` policy allowed a worker-owned snapshot when `observed_by` matched the worker and the worker had facility access, but did not bind the accepted `source` value to that worker branch. Consequently, a worker could label their own snapshot as `storekeeper_count`.
- Added migration `20261108090000_busho_inventory_snapshot_source_role_guard.sql` to replace that policy with explicit role/source alignment: workers may submit only `worker_report` snapshots attributed to themselves; assigned storekeepers may submit `facility_count` or `storekeeper_count` snapshots with `observed_by` null. The migration does not grant broader table privileges or change production.
- Migration committed as `356660e`. It has not yet been applied to the developer's local database or verified. Pull, apply locally, and rerun E2E before marking this finding resolved. The current failed run retained synthetic fixtures under `88c259cd` as expected; no reset is required.
