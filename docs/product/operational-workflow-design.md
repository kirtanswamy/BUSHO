# BUSHO operational workflow redesign

**Status:** Implementation specification for the prototype phase  
**Scope:** Chhattisgarh district/block directory; worker, supervisor and facility-store workflow  
**Date:** 6 November 2026

## Product decision

BUSHO is a reporting, review and coordination layer. It is not a replacement for the Government of Chhattisgarh's CGMSC DPDMIS, the national HMIS, or the PMBI Janaushadhi operating system. It must not claim to submit a government indent, place a purchase order, dispatch a truck or record a government receipt unless that event has been entered by an authorised operator or received through an approved integration.

The current public-demo credentials and browser storage are not production authentication or a shared database. The new workflow is therefore a same-browser, same-origin operational simulation with explicit synthetic-data labels.

## Research-based role boundaries

| Actor | What BUSHO should support | What BUSHO must not assume |
|---|---|---|
| ASHA / field worker | Community follow-up observations and approved programme activity, where in scope | Clinical diagnosis, medicine prescribing, or authority to submit a facility indent |
| CHO / HWC team lead | Public-health monitoring, aggregated reporting, team support, local action planning, HWC administration and inventory oversight | Authority to approve all district procurement or to issue stock from a warehouse |
| Medical Officer / PHC or block clinical supervisor | Review of programme delivery, staff supervision, public-health surveillance and referral/escalation | A generic “supervisor” account automatically has store or procurement permissions |
| Facility store / pharmacist / authorised store user | Facility stock register, indent preparation, receipt, batch/expiry and consumption transactions under DPDMIS | Authority to bypass annual indent / approved programme / warehouse controls |
| CMHO / Directorate / CGMSC / warehouse | State-defined scrutiny, annual indent consolidation, procurement, warehouse issue and distribution | These are not represented as BUSHO actions in the browser demo |
| Jan Aushadhi Kendra operator / PMBI network | PMBI Kendra inventory and replenishment through PMBI's own portal, warehouses and authorised distributors | A PMBJK's stock must not be mixed with public HWC/CGMSC stock |

## Target report and supply workflow

1. Worker captures an aggregate field observation. No patient name, phone number, ABHA number, address, or individual clinical record is permitted in the demo.
2. Worker reviews the extracted fields and submits the report. Submission is not approval.
3. Supervisor reviews the original note and structured fields. The supervisor can verify, request correction, or reject with a recorded reason.
4. A verified stock concern can be converted into a *replenishment draft*. The report remains linked to the draft. A draft is not an indent.
5. The authorised facility-store operator checks the current stock, approved annual indent / balance, required programme, unit and requested quantity. In this prototype that is a clearly labelled simulated store action.
6. Completing the indent moves it to “submitted to warehouse (demo)”. It does not mean the warehouse has accepted or issued it.
7. Warehouse issue is entered as a separate event with issue reference/date and issued quantity.
8. Dispatch is recorded separately as “in transit (demo)”. The prototype does not claim live carrier tracking.
9. Facility receipt records receipt number/date, received quantity, batch, expiry and rack. Only accepted receipt quantity increases the demo facility balance.
10. The worker can see the end-to-end status and each dated event. Supervisors can inspect the same timeline, current stock, exceptions and audit trail.
11. Consumption is a separate transaction and follows FEFO (first expiry, first out) across known demo lots.

## Directory and data coverage

- Load the Government of Chhattisgarh development-block directory reference for all 33 districts and 146 blocks.
- The source is the Chhattisgarh Industrial Development Policy 2024–30, Annexure “Categorization of Development Blocks” (pages 15–16), cross-checked against the Integrated Government Online Directory's Chhattisgarh district list (33 districts; page updated 7 August 2026).
- This is an administrative development-block directory, not a verified health-facility register.
- Do not infer HWC, PHC, CHC, PMBJK, pharmacist or worker counts from the number of blocks.
- Keep every block available for selection. Other than the one synthetic demonstration context in Dhamtari district / Dhamtari block, locations have no BUSHO operational records until an authorised facility master is imported.
- The one demo facility is explicitly named as synthetic. It must never be represented as a live government HWC.
- PMBJK location lookup remains a link to PMBI's official Kendra locator. PMBJK inventory is a separate operating model.

## Source-backed operating patterns

- IPHS 2022 assigns CHOs public-health leadership, team support and supervision of MPWs/ASHAs, reporting, HWC inventory oversight and local action planning. PHC/UHWC pharmacist standards include stock-register and store/inventory management.
- Chhattisgarh's DPDMIS Health Facility Store manual documents facility-store operations: indent to warehouse, current/warehouse stock and balance to be lifted, a completed indent sent to the warehouse module, receipt with receipt number/date, quantity, batch/expiry/rack, and separate consumption entries. The manual documents FEFO issue.
- CGMSC's AAM/SHC DPDMIS portal lists opening stock, indent to warehouse, indent to parent facility, receipt from warehouse/facility, consumption, stock-register, near-expiry, hold-batch and warehouse-stock guidance.
- The CAG Chhattisgarh performance audit (Report No. 02 of 2024; audit period ended March 2022) records historical procurement, stock-availability and DPDMIS control weaknesses. These historical findings justify strong traceability and data-quality controls; they are not a statement of current stock conditions.
- PMBI's PMBJP is a separate supply chain. Kendras purchase through PMBI warehouses / authorised distributors under PMBI conditions; it is not a public HWC's CGMSC indent.

## Data model

The shared demo state contains:
- a block directory reference;
- one synthetic demo facility and its synthetic opening stock;
- worker-submitted reports, immutable source-note revisions and review events;
- stock indent drafts linked to verified reports;
- warehouse issue, dispatch and facility-receipt events;
- batch/expiry-aware inventory lots and consumption transactions;
- an append-only demo activity log.

Every state-changing action records an actor label, timestamp, entity, previous status, next status and a short reason. IDs generated by BUSHO are marked “DEMO”; they are not CGMSC indent, PO, warehouse, receipt or e-Aushadhi references.

## Visual design principles

- Turn the supervisor overview into a live operational queue, not a dashboard of hand-authored counts.
- Make the report inbox actionable: inspect original note, structured fields, location, worker, review status and actions.
- Separate report verification from stock indent processing.
- Make “current stock”, “requested”, “warehouse issued”, “dispatched”, “received” and “consumed” distinct quantities and events.
- Put the same timeline on the worker report card and the supervisor/store detail view.
- Make empty directory blocks visibly empty rather than filling them with invented health data.
- Mark all synthetic records, initial balances, demo user identities and simulated logistics steps.
- Keep the existing worker extraction, language selector, legal pages and portal navigation working.

## Explicit non-goals for this prototype

- Real patient-level records, diagnosis, treatment recommendations or clinical decision support.
- Production credentials, OTP, role-based access control, encryption-at-rest, cross-device synchronization or a server-side audit log.
- Direct HMIS, DPDMIS, CGMSC, Digital Dwaar, PMBI or Janaushadhi API integration without written authorisation, API documentation and credentials.
- A live list or count of every AAM/HWC/PHC/CHC/PMBJK in the state when an authoritative, current export is not publicly available.
- Real purchase orders, warehouse dispatch, GPS tracking, courier integration or proof of physical delivery.
- Live outbreak detection or clinical trend conclusions.

## Acceptance criteria

1. A worker-confirmed report appears in the supervisor inbox from the same browser profile without manual refresh.
2. Report review offers verify, request correction and reject, each with a recorded actor/time/reason.
3. An indent cannot be created from an unverified report.
4. A store action is separate from supervisor report verification.
5. An indent cannot be marked issued, dispatched or received out of sequence.
6. Only received quantities increase facility stock; a receipt records batch and expiry.
7. Consumption reduces lots in FEFO order and cannot exceed available stock.
8. Worker and supervisor views show the same report/indent timeline and current status.
9. Health trends, KPIs and queue counts are calculated from records, not fixed demo numbers.
10. The directory includes all 33 districts and 146 development blocks, but health-facility counts remain blank unless supported by an imported source.
11. The worker and supervisor portals remain functional at desktop and mobile widths.
12. Existing test and smoke checks pass on the repository's Node 18, 22 and 24 CI matrix.
