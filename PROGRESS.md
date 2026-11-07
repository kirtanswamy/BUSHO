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

Previously verified CI checkpoint: run `42364188879` passed Node 18/22/24 and PostgreSQL 17 RLS/database-contract checks for the worker integration. It does not verify the later supervisor workspace. Latest supervisor changes are awaiting a fresh CI run; Vercel preview is currently rate-limited.

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
- **Current verification:** this checkpoint has not yet completed a fresh GitHub Actions run. Vercel currently reports a build-rate-limit failure for the feature branch preview; production remains untouched. Do not call this milestone green until the latest CI result is inspected.
- **Known limitation:** no Auth users/facilities/workers/assignments/reports exist in the live project, so no live supervisor screen or real review transition has yet been demonstrated. The automated tests use controlled fixtures.
- **Next:** run CI, fix all test failures, then build worker report history/assigned facility context and a secure administrator provisioning workflow. Only after provisioning should a two-account/two-facility end-to-end test be attempted.
