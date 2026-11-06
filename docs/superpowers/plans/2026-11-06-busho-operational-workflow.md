# BUSHO Operational Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the split static/localStorage reporting bridge with one auditable demo workflow and a source-grounded Chhattisgarh development-block directory.

**Architecture:** Keep the dependency-free vanilla HTML/CSS/JavaScript stack. Add a pure workflow state module, a static directory reference, and a portal renderer that consumes one same-origin browser-local store. Keep all government integrations read-only links until an approved API and credentials exist.

**Tech Stack:** Node.js 18+, vanilla JavaScript, localStorage, existing static HTML/CSS, Node test runner.

**Spec:** `docs/product/operational-workflow-design.md`

## Global Constraints

- Do not store real patient-identifiable or sensitive health data in the demo.
- Every prototype record, ID, opening balance, logistics event and account identity must be labelled synthetic.
- Keep CGMSC DPDMIS, HMIS and PMBI as separate systems and do not claim BUSHO writes to them.
- Preserve existing worker extraction, languages, portal routes and legal pages.
- Do not fabricate facility/worker/Kendra counts; directory blocks without imported source data remain empty.
- No new runtime dependency.

## Review Focus

- A report cannot be verified twice or move backwards without an explicit correction/revision event.
- An indent cannot be created from an unverified report.
- An indent cannot be dispatched before warehouse issue or received before dispatch.
- Only accepted receipt quantity updates inventory; receipt batches carry expiry and FEFO consumption.
- Browser tabs on the same origin remain in sync; cross-device users do not falsely appear shared.

---

### Task 1: Workflow and directory contract tests

**Files:**
- Create: `tests/workflow.test.cjs`
- Create: `tests/directory.test.cjs`

**Interfaces:**
- Workflow module exposes `window.BUSHO_WORKFLOW`.
- Directory module exposes `window.BUSHO_DIRECTORY`.

- [ ] Write lifecycle tests for report submit, review, indent, warehouse issue, dispatch, receipt and FEFO consumption.
- [ ] Write guard tests for invalid transitions and unverified indents.
- [ ] Write directory tests for 33 districts, 146 blocks and no fabricated facility rows.
- [ ] Run `npm test` and confirm the new tests fail because the modules do not yet exist.

### Task 2: Source-grounded directory and shared workflow model

**Files:**
- Create: `directory-data.js`
- Create: `workflow-store.js`

**Interfaces:**
- `BUSHO_DIRECTORY.getDistricts()`, `getBlocks(districtId?)`, `getDemoFacility()`.
- `BUSHO_WORKFLOW.submitReport()`, `reviewReport()`, `resubmitReport()`, `createIndentDraft()`, `submitIndent()`, `recordWarehouseIssue()`, `recordDispatch()`, `recordReceipt()`, `recordConsumption()`, `getState()`, `reset()`.

- [ ] Implement directory metadata and all block names from the cited state policy table; keep facility registry separate.
- [ ] Implement guarded state transitions and append-only demo events.
- [ ] Implement lot-aware inventory and FEFO consumption.
- [ ] Run `npm test` and verify the tests pass.

### Task 3: Worker and supervisor workflow UI

**Files:**
- Create: `workflow-ui.js`
- Create: `portal-operations.css`
- Modify: `worker.html`
- Modify: `supervisor.html`
- Modify: `app-v2.js`

- [ ] Connect the worker's existing confirmation action to `BUSHO_WORKFLOW.submitReport()`.
- [ ] Render worker report history and a shared, dated status timeline.
- [ ] Replace static supervisor inbox, KPIs, trends, facilities, workers, inventory and approvals with data derived from the shared state.
- [ ] Add a distinct simulated facility-store workflow for indent, warehouse issue, dispatch and receipt.
- [ ] Add source links and explicit data-coverage/empty states.
- [ ] Run `npm test`, `node --check` for changed scripts and `npm run smoke`.

### Task 4: Remove the legacy duplicate bridge and document boundaries

**Files:**
- Create: `portal-enhancements-v3.js`
- Modify: `worker.html`
- Modify: `supervisor.html`
- Create: `docs/research/chhattisgarh-health-workflow-sources.md`
- Create: `docs/product/operational-workflow-design.md`

- [ ] Preserve profile/notification behavior without the second shared-report data store.
- [ ] Load the new workflow modules after the existing portal foundation.
- [ ] Ensure public source links distinguish CGMSC and PMBI.
- [ ] Verify reset clears only demo operational records and returns the directory to one synthetic facility context.

### Task 5: Full verification and review

**Files:**
- Verify all changed files and tests.

- [ ] Run `npm run check`.
- [ ] Check no fixed supervisor counts or static report rows remain in the operational modules.
- [ ] Review all state transitions and role boundaries against the design spec.
- [ ] Open a draft PR; do not merge to `main` without the owner's approval.
