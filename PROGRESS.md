# BUSHO Development Progress

Last updated: 2026-11-07
Working branch: `feature/chhattisgarh-operational-workflow`
Base branch: `main`
Production branch: unchanged

> This file is the durable hand-off note for continuing the work in a new chat or after a timeout. Update it whenever a milestone changes state.

## Current state

- The work is isolated on a feature branch. No merge to `main` has been performed.
- Three foundational implementation commits are present, followed by CI/test hardening commits.
- The report/indent state machine exists in `workflow-core.js`.
- A sourced Chhattisgarh geography and PMBJK dataset exists in `data/chhattisgarh-directory.json`.
- Supabase project `BUSHO` is connected to the feature branch. The live project has 23 public tables, RLS policies, Chhattisgarh geography and dated PMBJK reference snapshots.
- Worker report submission is connected to Supabase Auth + the authenticated REST client and persists reports/items/events server-side. The browser-local per-user draft is recovery-only and is cleared after confirmed submission.
- Supervisor report inbox, detail review, verify/return/escalate/reject/close actions, facility activity summaries and audit timeline are now being connected to the same Supabase report records. Latest implementation is awaiting CI verification.
- Live project still has zero operational facilities, workers, Auth users and report records. Real multi-user workflow cannot be demonstrated until an authorised provisioning process creates the records and assignments.
- No production health system, live government integration, procurement system or clinically validated workflow is claimed.

## Milestone tracker

| Part | Scope | Status | Exit criteria |
|---|---|---|---|
| 0 | Repository, data-flow, role and product audit | Complete | Existing role portals, shared browser store, dashboard placeholders, auth and deployment limits documented |
| 1 | Operational workflow foundation | Complete | CI green on Node 18/22/24; report permissions and corrections; indent approval; DPDMIS reference states; receipt guards; audit events |
| 2 | Persistent backend and role security | Foundation complete; provisioning pending | Connected Supabase project; RLS/column grants; server-controlled roles; authenticated report persistence; live multi-user test still blocked on authorised account/facility provisioning |
| 3 | Health worker portal | Submission connected; history/context pending | Worker can review extracted fields and submit to Supabase; next: server-backed history, supervisor return notes, resubmission and assigned-facility context |
| 4 | Supervisor portal | First live inbox/review UI implemented; CI pending | RLS-scoped inbox, report detail, structured observations, database audit timeline, verify/return/escalate/reject/close; next: verify CI and run authenticated end-to-end workflow |
| 5 | Inventory fulfilment | Not started | Indent → external system reference → allocation → dispatch/challan → partial/full receipt → stock ledger reconciliation |
| 6 | Statewide coverage data | Partially sourced | 33 districts + LGD block master present; reconcile one duplicate parent mapping; import verified AAM register and sourced PMBJK locations/counts |
| 7 | End-to-end demo/release | Not started | Worker-to-supervisor-to-store-to-receipt walkthrough, automated and manual browser tests, responsive audit, screenshots, preview deployment |

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
