# BUSHO — Current engineering audit

**Audit date:** 2026-11-12  
**Branch:** `feature/chhattisgarh-operational-workflow`  
**Pull request:** [#5](https://github.com/kirtanswamy/BUSHO/pull/5) — draft; not merged  
**Audit type:** read-only repository review plus narrowly scoped test/CI/documentation corrections

## Executive finding

BUSHO has moved beyond the original static mock-up. The feature branch contains a Supabase-backed operational foundation for authenticated worker reports, supervisor review, storekeeper supply handoffs, administrator provisioning, facility registry review, medicine-reference source review, audit events and inventory movements.

It is not yet a live government pilot. The connected hosted Supabase project has no operational users/facilities/assignments/reports; feature migrations and Edge Functions are not deployed there. No government APIs, current authoritative facility master, pharmacist-approved normalized catalogue, or verified physical inventory are connected.

## Confirmed implementation areas

- Authenticated role portals for worker, supervisor, storekeeper and administrator.
- Report persistence, authenticated worker history, correction and resubmission.
- Supervisor report inbox, review transitions, scoped access and event history.
- Supervisor replenishment recommendation workflow with idempotency key and database-side quantity/item integrity guards.
- Storekeeper allocation, dispatch, partial receipt and final receipt paths.
- Facility registry staging and human review; public directory snapshots are not auto-promoted to assignable facilities.
- Provisioning Edge Function source with role/scope/consent checks and rollback handling.
- Medicine reference catalogue schema and source transcription/review gates for 278 Chhattisgarh EDL 2025 rows; all rows remain pending authorised pharmacist/CGMSC review.
- PostgreSQL RLS/security contract tests, Node tests, local Supabase API E2E and Playwright browser E2E scripts.
- Local synthetic multi-role test setup documented in `docs/local-supabase-e2e.md`.

## CI correction made during this audit

The latest hosted CI run on commit `1a64a545` failed in all Node matrix jobs. Retrieved job logs identified three failures in the supervisor supply-handoff recovery tests: the test harness did not mock `listSupervisorReports()` and `listInventory()`, although the supervisor portal calls both during load.

The harness was corrected to supply those read dependencies. CI was also updated to apply all five newer replenishment migrations before PostgreSQL security/RLS assertions:
- `20261111190000_replenishment_insert_integrity.sql`
- `20261111200000_replenishment_guard_deduplication.sql`
- `20261111210000_replenishment_quantity_guard.sql`
- `20261111220000_replenishment_submission_idempotency.sql`
- `20261111230000_grant_replenishment_submission_key.sql`

Hosted CI completed successfully on the code-fix commits, with Node 18, 22, 24 and PostgreSQL database-contract jobs all passing. Documentation-only commits then triggered another CI run; verify the latest-head run before treating the current branch as fully green.

## Documentation corrections made

- `ARCHITECTURE.md` now reflects the authenticated four-role architecture, database security model, integration boundaries and current public-reference data gates.
- `DEMO_SCENARIOS.md` now describes a complete synthetic worker → supervisor → storekeeper scenario, negative permission tests, failure recovery and evidence pack.

## Latest provisioning reliability work

A service-role-only `provisioning_operations` ledger has been added through migration `20261112120000_durable_provisioning_operations.sql`. It records the requesting administrator, unique idempotency key, canonical request fingerprint, target email/role, current step, Auth user ID when known, result and reconciliation state. Browser-facing `anon` and `authenticated` roles have no table privileges.

The provisioning Edge Function now creates a durable operation before inviting the user, checkpoints the Auth identity immediately after the invite returns, records relationship/assignment progress, and stores a completed result only after the provisioning audit event. Repeated requests with the same administrator/key and same payload return the completed result; an in-progress or failed operation is not blindly re-invited. Reusing a key with changed details is rejected.

The admin UI retains the same request key when the outcome is uncertain and clears it only after confirmed success. This prevents a user retry after a network timeout from silently creating a second invitation.

Important limitation: a process crash can still occur between the external Auth side effect and the next database checkpoint. Such operations remain visibly in progress and require reconciliation; this implementation does not claim automatic crash recovery. A dedicated authorised reconciliation workflow is still required before production provisioning.

## Provisioning reconciliation endpoint

Added migration `20261112130000_provisioning_reconciliation_payload.sql` and a read-only Edge Function at `supabase/functions/reconcile-provisioning/index.ts`.

The migration stores the validated, non-secret provisioning intent (display name, preferred language, facility IDs, geographic scope and consent flag) so an administrator can compare the original request with persisted account relationships. It excludes passwords, invitation tokens and credentials.

The endpoint:
- Requires an authenticated, active `platform_admin` profile.
- Inspects `reconciliation_required` operations and `in_progress` operations unchanged for more than five minutes.
- Limits each inspection to 50 oldest matching operations.
- Checks the Auth identity, profile, worker record, facility assignments and administrative scope assignments.
- Classifies findings and recommends a manual next step.
- Performs no insert, update or delete. It does not send invitations, activate accounts, suspend accounts or delete Auth users.

Important boundary: operations without a checkpointed Auth user ID are flagged for exact-email manual inspection; the endpoint does not search Auth by email or infer identity. A finding that relationships appear complete is not automatically closed; an administrator must separately verify the audit event and make an authorised decision. This is an inspection tool, not an automated repair mechanism.

## Remaining work — engineering we can complete without government access

### P0 — Prove the complete operational workflow
- Complete local authenticated browser E2E for worker submission, supervisor verification/correction, supervisor recommendation/approval, storekeeper allocation/dispatch/partial/final receipt and audit history.
- Confirm role and facility isolation across all four roles, including direct API attempts.
- Add or strengthen concurrency tests for duplicate report submissions, concurrent corrections, duplicate provisioning/invites, concurrent inventory movements and receipt retries.
- Test stale sessions after account suspension/revocation and incomplete provisioning rollback.
- Ensure every write path refreshes from server state and blocks stale actions after uncertain outcomes.

### P1 — Make stock accounting complete for the pilot
- Define and implement opening-balance evidence, inbound receipt, issue/consumption, adjustment, transfer, stocktake, variance approval and expiry/lot tracking.
- Enforce facility/item/unit consistency and immutable movement history at database level.
- Calculate pilot balances only from an approved opening balance plus complete posted movements.
- Label every seeded balance and transaction as synthetic; never mix it with public reference data.

### P1 — Build public-data ingestion and integration readiness
- Maintain source URL, publisher, retrieval date, source publication date, licence/terms, source hash and field-level provenance.
- Keep district/block administrative references, facility registry candidates, AAM/CGMSC medicine references and PMBJK centre references as separate datasets.
- Add import preview, schema mapping, duplicate detection, stale-data flags, review decisions and rollback.
- Do not treat a public directory as an authoritative operational facility master or public medicine listing as an approved facility formulary.
- Build adapter interfaces and contract tests for future DPDMIS/other government integrations; no API calls or credentials until authorised.

### P1 — Add useful pilot features
- Voice: capture/recording, transcription adapter, editable extraction, confidence and explicit user confirmation. Treat browser speech APIs as an optional device capability, not guaranteed offline speech recognition.
- Offline: encrypted local draft queue, explicit pending/synced/failed states, idempotent sync, conflict handling and safe logout/device handling.
- Predict: transparent rules first; show source, time window, sample size, confidence and reasons. Do not present forecasts from incomplete synthetic data as real shortages.
- Pulse: dashboards limited to data actually visible to the signed-in role; distinguish verified reports, pending reports, stale observations and synthetic metrics.
- Trust: event provenance, actor, role, timestamp, source and reason for every consequential change.
- Network: inter-facility transfer request, authorisation, dispatch and receiving confirmation.
- Impact: compute workflow timing and quality metrics from test/pilot events; do not fabricate baselines or impact claims.

### P2 — Demonstration readiness
- Seed resettable, clearly labelled synthetic fixtures for multiple districts/facilities and all roles.
- Add a one-command local demo bootstrap and reset procedure that never targets hosted Supabase.
- Create a judge-mode walkthrough and a technical evidence pack (architecture, RLS, API contracts, CI, failure tests, source provenance).
- Run a timed rehearsal on the exact demo hardware/network; include an offline/failure fallback recording.
- Keep a visible boundary between public reference information, synthetic operational data and government-authoritative data.

## External gates after selection/authorisation

- Official current facility master and verified assignments.
- Authorised pharmacist/CGMSC medicine catalogue review and mapping.
- Verified physical stock counts and signed opening balances.
- Government API access, documentation, credentials, security review and data-sharing approval.
- Approved healthcare department/facility pilot, named accountable users, SOPs, training, support and incident escalation.
- Privacy, retention, consent, security and clinical/operational governance review before any sensitive patient data is processed.

## Safety and release constraints

- Do not apply feature migrations or deploy Edge Functions to the connected operational Supabase project without separate explicit approval.
- Do not create hosted test users, facilities, reports or inventory records without an explicitly approved non-production environment.
- Do not create a paid Supabase branch/project without explicit cost approval.
- Do not merge PR #5 or deploy production as part of this audit.
- Do not use patient-identifiable data in fixtures or demonstrations.
- Do not claim live DPDMIS integration, government approval, actual stock availability, pharmacist approval or measured healthcare impact unless verified evidence exists.
