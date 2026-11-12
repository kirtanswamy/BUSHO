# BUSHO Stock Accounting — Design and Local Approval Gate

Status: engineering design proposal; **not an approved government SOP**  
Date: 2026-11-08  
Scope: facility-level stock evidence, receipts, issues, adjustments and reconciliation.

## 1. Current boundary

BUSHO currently records dated stock observations and immutable inbound receipt movements. It does not have a verified opening-balance baseline or a complete outbound/adjustment/transfer ledger. Therefore the application must not calculate or label a current stock balance, available stock, reorder quantity or stockout status as authoritative.

A stock observation is a count/evidence point. It is not itself a ledger movement. An inbound receipt is a movement supported by an external goods-receipt reference. Neither alone establishes the complete balance.

## 2. Proposed accounting invariant

For a specific facility, item, unit and effective timestamp:

**Closing quantity = approved opening quantity + sum(posted signed movements after opening)**

The equation is valid only when the opening baseline is approved, every movement in the period is represented, all quantities use the catalogue item's canonical unit, and reversals/corrections are linked and auditable. A snapshot must not be silently added to ledger movements.

Until those preconditions are satisfied, the UI should display the latest observation and movement evidence separately and say **balance unavailable**.

## 3. Candidate movement taxonomy — requires local approval

The following are candidate event types for a future ledger. They are not assumed to match Chhattisgarh or facility SOPs:

- Opening balance (one approved baseline per item/facility/period).
- Inbound receipt (existing event; linked to replenishment request and external GRN).
- Outbound issue/dispensing (requires the locally approved issue record and recipient category; never patient-identifying data).
- Transfer out / transfer in (paired, linked movements across two facilities; both sides reconciled).
- Approved positive/negative adjustment (reason, evidence and approver required).
- Expiry, damage or write-off (separate reason code and approval).
- Return to store (linked to original issue and local process).

No type should be activated until the competent authority defines the event, actor, evidence, approval and effective-date rules.

## 4. Required movement fields

A future immutable ledger should include:

- Facility, inventory item, catalogue reference and canonical unit.
- Movement type, signed quantity delta, effective timestamp and recorded timestamp.
- External document/reference and source system where applicable.
- Actor user ID, role at time of action, and authorized facility scope.
- Data provenance (operational or synthetic_demo).
- Idempotency key / originating transaction identity.
- Approval state and approver identity for controlled event types.
- Reversal/correction link; do not edit or delete a posted movement.
- Audit event and source evidence attachment metadata without patient identifiers.

Unique constraints should prevent duplicate posting for the same originating transaction/reference. Corrections should be compensating movements, not destructive edits.

## 5. Opening balance and stocktake

Before balances are shown:

1. Facility and item master must be verified and active.
2. A dated physical count must be captured by an authorized storekeeper.
3. The count unit and conversion must match the approved catalogue item.
4. A second authorized reviewer must approve the baseline and record the evidence/reference.
5. The baseline must identify the accounting start time; older movements must not be double-counted.
6. Subsequent count variances must be reconciled through an approved adjustment workflow.

Whether two-person verification, cycle counts, and approval thresholds are required must be confirmed against the local SOP.

## 6. Controls and tests required before implementation

- Storekeeper can record only locally authorized event types within assigned facility scope.
- Supervisor can approve only event types explicitly assigned to that role; no implicit storekeeper powers.
- No self-approval where separation of duties is required.
- Posted movement UPDATE/DELETE is denied to browser roles and service workflows; reversal is append-only.
- Cross-facility transfers require matched source and destination legs; neither side can fabricate the other.
- Quantity, unit, timestamp, duplicate reference, negative balance and concurrent posting checks are enforced transactionally.
- Stale observations never overwrite a newer observation.
- A balance is displayed only with a visible effective timestamp and reconciliation status.
- Synthetic evidence is clearly labelled and never mixed into operational totals.
- Export includes provenance, approvals, references and reconciliation state.

## 7. Decisions required from the competent authority

Before coding the balance engine, obtain written confirmation of:

- Applicable store ledger and stock register format.
- Authorized roles/cadres for receiving, issuing, adjustment, transfer and approval.
- Whether and how opening balances are certified.
- Unit-of-measure and pack-size conversion authority.
- Whether negative stock is ever permitted and under what exception.
- Transfer, return, expiry, damage and write-off procedures.
- Count frequency, variance thresholds and approval chain.
- Required source-system references and integration constraints.
- Retention, correction and audit requirements.

## 8. Release decision

This document is an engineering proposal only. It does not authorize procurement, prescribing, dispensing, stock issue, a government-system transaction or a live balance calculation. Keep the current evidence-only inventory screen until the decisions above are documented and the resulting ledger passes database, RLS, concurrency, idempotency and multi-user E2E tests.
