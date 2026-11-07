# BUSHO Development Progress

Last updated: 2026-11-06
Working branch: `feature/chhattisgarh-operational-workflow`
Base branch: `main`
Production branch: unchanged

> This file is the durable hand-off note for continuing the work in a new chat or after a timeout. Update it whenever a milestone changes state.

## Current state

- The work is isolated on a feature branch. No merge to `main` has been performed.
- Three foundational implementation commits are present, followed by CI/test hardening commits.
- The report/indent state machine exists in `workflow-core.js`.
- A sourced Chhattisgarh geography and PMBJK dataset exists in `data/chhattisgarh-directory.json`.
- The full website screens have **not** yet been integrated with this workflow engine.
- The current data store is still browser-local. Cross-device / authenticated shared persistence is **not** implemented.
- Do not describe this as a production health system, a live government connection, a procurement system, or a clinically validated workflow.

## Milestone tracker

| Part | Scope | Status | Exit criteria |
|---|---|---|---|
| 0 | Repository, data-flow, role and product audit | Complete | Existing role portals, shared browser store, dashboard placeholders, auth and deployment limits documented |
| 1 | Operational workflow foundation | Complete | CI green on Node 18/22/24; report permissions and corrections; indent approval; DPDMIS reference states; receipt guards; audit events |
| 2 | Persistent backend and role security | Blocked / not started | Connected database project; server-side role auth; shared worker/supervisor records; facility scope and audit permissions |
| 3 | Health worker portal | Not started | Worker can save draft, review extracted fields, submit, see supervisor actions/return reason, resubmit, track stock observations |
| 4 | Supervisor portal | Not started | Inbox opens record detail; verify/return/escalate; compare recent history; approve indent; view facilities/workers and event trail |
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

- `role-auth.js` remains a client-side demo gate and is not production authentication.
- Current shared worker/supervisor records use browser `localStorage`, so they only sync between tabs/profiles on the same browser origin; this is not a multi-device database.
- Supabase has been suggested but is not yet confirmed connected to this session. No database migrations or production credentials have been created.
- Access to the existing Vercel team-scoped BUSHO project returned 403. A single-use access request was generated but requires the project owner to approve it; no team scope has been changed by the agent.
- The local container cannot resolve GitHub for a clone, so repository edits have been made via GitHub API commits. GitHub Actions is being used for test execution.

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

Latest pull-request CI run: `42265557716` (success) on commit `61ffc9f`, across Node 18, 22 and 24. GitHub also reports Vercel deployment status success for the PR head. Earlier red runs were test-first failures; the final matrix passes.

## Immediate next actions

1. Begin Part 2: design the persistent data model and RLS/role-access rules; Supabase connection is still required before applying migrations or obtaining live project credentials.
2. Build tested API/data adapters so worker and supervisor screens read/write one shared workflow source, not duplicated browser-local rows.
3. Integrate report submission, supervisor verify/return/escalate, indent approval, external DPDMIS references, dispatch and receipt into the portals.
4. Add tests for each screen-to-store hand-off before implementing the related UI.
5. Add block selector/search using sourced LGD codes; every unseeded block must visibly remain empty.
6. Test the complete Dhamtari synthetic scenario end to end before expanding sample activity.

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
