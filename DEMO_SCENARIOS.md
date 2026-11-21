# BUSHO — End-to-End Synthetic Pilot Demonstration

This runbook is for a controlled local pilot using synthetic identities, synthetic facilities, synthetic reports and synthetic inventory. Do not use patient-identifiable data or claim that public reference records are verified operational facilities. The live government systems are not connected.

## Preconditions

- Use the feature branch and local Supabase stack only.
- Follow `docs/local-supabase-e2e.md` to provision the documented synthetic test identities and facilities.
- Confirm the local Supabase URL and keys; do not run `supabase link`.
- Confirm the demo data banner and synthetic facility labels are visible.
- Start from a clean, resettable local fixture state.
- Record the tested commit SHA and test output.

## Scenario A — Worker report to supervisor verification

1. Sign in as Synthetic Worker A assigned to Synthetic Facility A.
2. Create a report using aggregate, non-identifiable synthetic information.
3. Review the original text and proposed structured fields.
4. Correct any field that is inaccurate; confirm and submit the report.
5. Reload the worker portal and verify the report remains in authenticated history.
6. Sign out and sign in as Supervisor A, scoped to Facility A.
7. Open the report inbox, inspect the original report and structured observations, then verify it.
8. Inspect the report event timeline and confirm actor, state and timestamp are present.
9. Return a report for correction in a separate run; sign in as the worker, correct and resubmit it.

Expected result: the report is persisted, role-scoped, auditable and moves only through permitted state transitions. A worker-confirmed report is not a diagnosis.

## Scenario B — Supervisor supply recommendation

1. As Supervisor A, select a supervisor-verified report.
2. Select an active synthetic inventory item belonging to the same facility.
3. Enter a positive whole requested quantity and non-negative reported on-hand quantity in the item's unit.
4. Submit the recommendation and note the generated request identifier.
5. Retry the same submission using the same saved draft/key; verify it does not create a duplicate request.
6. Inspect the recommendation queue and its audit history.
7. Approve the recommendation.
8. Record an external DPDMIS reference only as a clearly marked synthetic demonstration reference; do not imply a real DPDMIS submission.

Expected result: the recommendation is a BUSHO workflow record. No external indent, purchase order or government transaction is created.

## Scenario C — Storekeeper fulfilment

1. Sign in as Storekeeper A assigned to the same synthetic facility.
2. Open the eligible handoff.
3. Allocate the requested quantity and record a synthetic allocation reference.
4. Dispatch the quantity and record a synthetic dispatch reference.
5. Record a partial receipt, then the remaining receipt.
6. Retry a receipt operation to verify idempotent handling and inspect the movement ledger.
7. Confirm the request reaches the expected terminal state and the movement history remains traceable.

Expected result: allocation, dispatch and receipt are separate events. Do not present simulated quantities as real stock balances.

## Scenario D — Isolation and negative permissions

1. Sign in as Worker B assigned to Facility B and confirm Facility A records are not visible.
2. Sign in as Supervisor B assigned to a different block/facility scope and confirm Facility A records are not visible.
3. Attempt unauthorised role transitions using the documented automated tests, not by altering production data.
4. Verify storekeepers cannot verify worker reports or approve supervisor recommendations.
5. Verify inactive/revoked identities cannot continue protected actions after session revalidation.

Expected result: backend RLS and database guards deny cross-scope and cross-role actions, not merely the frontend.

## Scenario E — Failure recovery

Exercise the documented local tests for:
- network interruption during report submission;
- duplicate submission and retry;
- failed transition followed by refresh;
- successful write followed by failed list refresh;
- interrupted provisioning and rollback;
- stale session after suspension/revocation;
- concurrent updates to the same record;
- partial receipt and repeated receipt submission.

Expected result: uncertain outcomes are surfaced, stale actions are blocked until refresh, retries are safe, and no test creates live government data.

## Evaluator evidence pack

Capture:
- tested commit SHA and environment label;
- CI run and database-contract result;
- local API/browser E2E result;
- role matrix and cross-facility denial evidence;
- one complete report-to-receipt event timeline;
- idempotency and failure-recovery results;
- source provenance for public reference datasets;
- explicit list of simulated data and unavailable government integrations.

## Claims that must not be made

- Do not call synthetic test results government operational statistics.
- Do not claim DPDMIS/API connectivity or real order placement.
- Do not claim the 278 EDL rows are pharmacist-approved.
- Do not claim facility snapshots are an authoritative current facility master.
- Do not claim current stock balances without a verified opening balance and complete approved movement ledger.
- Do not claim field validation, clinical impact or user adoption without an authorised pilot and measured evidence.
