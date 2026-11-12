# BUSHO — Role, responsibility and permission blueprint

**Version:** 1.0  
**Prepared:** 2026-11-07  
**Applies to:** Chhattisgarh reference implementation; future state adaptation requires local validation  
**Status:** Product and engineering baseline — not a government-approved SOP

## 1. Product boundary

BUSHO is an operational coordination layer for structured frontline reporting, human review, follow-up and visibility. It is not a replacement for HMIS, ABDM, CGMSC/DPDMIS, e-Aushadhi, PMBJP or clinical record systems. It must not create a medicine purchase order, make a diagnosis, prescribe treatment or claim an external system has accepted a transaction unless that system has returned a verifiable reference.

The first implementation is a **controlled reference deployment**:
- Real, dated administrative reference data may be used when provenance and limitations are displayed.
- Facility identities are assignable only after an authoritative current facility master has been received and each record has been reviewed.
- Synthetic facility scenarios, identities, inventory movements and patient-event tokens must be labelled as synthetic in the UI, database and exports.
- Never use real patient names, phone numbers, Aadhaar numbers, addresses, ABHA IDs, identifiable diagnoses or other patient identifiers in the demo.
- No live Supabase migration, account creation, Edge Function deployment or production release is authorised by this document.

## 2. Evidence labels

Every workflow decision in this blueprint uses one of these labels:

- **[CONFIRMED — source]** Supported by an official programme/system source or existing repository/database contract.
- **[IMPLEMENTED — code]** Present in the development branch; this does not mean deployed or field-validated.
- **[VALIDATE LOCALLY]** Plausible operating practice, but facility/state/programme-specific. Confirm with frontline workers and the responsible authority before treating it as policy.
- **[FUTURE — approval required]** Requires formal approval, data-sharing agreement, API access, updated schema or a separately approved release.

### Source set and limitations

1. MoHFW / PIB, 22 July 2025, Ayushman Arogya Mandir update: SHC-AAM team composition includes CHO, ANM, Male MPW and ASHAs in the catchment; PHC-AAM staffing includes Medical Officer, staff nurses, pharmacist, health assistants and lab technician. The exact deployment and task allocation must still be checked at the selected facility.  
   https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2146814&lang=2&reg=48
2. Chhattisgarh DPDMIS / CGMSC facility portal and manuals describe digital facility stock workflows, including opening stock, indent, receipt, issue, returns, stock registers and expiry-related processes. The publicly available facility manual reviewed is dated 2017; treat it as historical process documentation, not current definitive policy.  
   https://dpdmis.in/faconline/  
   https://dpdmis.in/DPDMISStock/GernalReport/FacilityDetails.aspx  
   https://dpdmis.in/faconline/Common/Document/MainStoreManual.pdf
3. C-DAC describes e-Aushadhi as a medicine supply-chain management system spanning warehouses and health facilities.  
   https://cdac.in/
4. PMBI / Jan Aushadhi is a separate scheme and supply-chain network. Do not model a Jan Aushadhi Kendra as an AAM facility or as a CGMSC facility store.  
   https://janaushadhi.gov.in/
5. MoHFW AAM directory source reviewed for this project links a roster dated 12-Aug-2024. It is historical reference only, not proof of current operational status.  
   https://aam.mohfw.gov.in/Home/Implementation_hwc_state
6. Chhattisgarh facility source review and import gate: `docs/facility-registry-source-review.md`.

## 3. Keep identity, cadre, assignment and scope separate

These concepts must not be collapsed into one role string:

- **Authentication identity:** the person’s account and login credentials.
- **Application role:** what classes of actions the account may perform (worker, supervisor, storekeeper, administrator).
- **Cadre / designation:** CHO, ANM, MPW, ASHA, pharmacist, Medical Officer, etc. This is descriptive and must be sourced/confirmed; it is not itself proof of permission.
- **Facility assignment:** which verified facility the person is assigned to and for what period.
- **Administrative scope:** state, district or block coverage for a supervisor/administrator.
- **Task capability:** which operational forms or queues the person is authorised to use at that facility/programme.

The current development schema supports application roles `worker`, `supervisor`, `storekeeper`, `district_admin`, `state_admin`, `platform_admin`, and `pending`, with facility and geographic-scope assignments. It does **not** yet model CHO, ANM, MPW, ASHA, pharmacist, Medical Officer or facility-head cadres as separate authenticated roles. Do not add these as independent login roles until the actual facility workflow and authorisation rules are validated.

## 4. Responsibility and permission matrix

| Persona / cadre | BUSHO application role | Can submit / update | Can review / approve | Must not be allowed to |
|---|---|---|---|---|
| CHO at SHC-AAM | `worker` by default; supervisor capability only if separately authorised | Submit assigned-facility service/operations reports; correct own returned report; record non-identifying follow-up status | Review only if formally assigned as a BUSHO supervisor for a defined scope; this is not implied by being a CHO | View other facilities by default; approve procurement; make clinical decisions through BUSHO |
| ANM | `worker` | Submit assigned programme/service activity and operational observations; correct own returned report | No general approval assumed | Approve stock indent or other workers’ reports unless a validated local delegation exists |
| Male MPW | `worker` | Submit assigned programme/service activity and operational observations | No general approval assumed | Access unrelated patient or facility records; approve procurement |
| ASHA | Optional `worker` account only if inclusion, consent, device access and supervision model are validated | A minimal, task-specific submission or referral/follow-up status if approved by the programme; prefer assisted entry where appropriate | No approval assumed | Be forced into a full clinical/stock workflow; see identifiable data for unrelated households |
| Pharmacist / facility store-in-charge | `storekeeper` | Maintain permitted stock observations, batch/expiry, receipts and issue evidence; reconcile facility stock records; record external DPDMIS reference | Confirm physical receipt and stock discrepancies within delegated authority; no automatic purchasing authority | Create purchase orders; claim DPDMIS/CGMSC status without an external reference; edit clinical reports |
| Facility supervisor / designated reviewer | `supervisor` | Add structured review notes and route work | Verify report completeness; return with reason; escalate to the designated clinical/programme authority; close only under validated rules | Change a worker’s original report silently; convert a report into a diagnosis; approve an indent solely because a report is verified |
| Medical Officer / facility head | No separate role in current schema; future delegated role | May provide a documented decision/response in a future approved workflow | Clinical/programme oversight and facility-level approvals only where the local SOP explicitly assigns them | Be assumed to have all supervisor/storekeeper permissions automatically |
| Block supervisor / BMO-level reviewer | `supervisor` with block scope, if authorised | Review block-scoped operational exceptions and follow-up | Route/escalate and monitor within assigned scope; approval rights require local SOP validation | See or act outside assigned block; approve clinical or procurement actions not delegated |
| District administrator / CMHO office | `district_admin` | Manage permitted district-scoped setup and facility registry review | Verify facility master candidates and manage scoped assignments if authorised | Automatically gain clinical approval, inventory transaction or patient-record permissions |
| State administrator | `state_admin` | Manage state-scoped reference setup and authorised registry review | Verify state-scoped reference data and administer scoped access | Override facility evidence or view identifiable patient data by default |
| Platform administrator | `platform_admin` | Technical account and platform administration | No clinical, programme or procurement approval | Use platform privilege to access patient content or bypass audit/approval |
| Jan Aushadhi Kendra operator | **Separate future tenant / workflow**; do not map to CGMSC storekeeper | Only Kendra-specific stock/availability observations if separately approved | Kendra owner/operator confirms its own records under PMBI rules | Mix Kendra stock with AAM/CGMSC inventory or inherit public-facility permissions |

### Important interpretation

- CHO, ANM, MPW and ASHA are **cadres**, not interchangeable application roles.
- The AAM team composition is source-supported; the exact task allocation and reporting hierarchy for a specific facility must be validated locally.
- A CHO may coordinate a Sub-Health Centre team, but that does not automatically grant authority to approve every worker report, medicine indent or clinical action.
- A pharmacist/store-in-charge owns the stock-handling workflow only to the extent authorised by the actual facility and DPDMIS SOP.
- Facility head / Medical Officer and BMO / CMHO responsibilities vary by facility type, programme and delegation. Do not encode assumed universal approval powers.
- Jan Aushadhi is a separate network. It requires a separate entity model and access policy if ever included.

## 5. Workflow ownership and state transitions

### A. Frontline report

1. A worker opens only their currently assigned facility and permitted task.
2. The worker enters a non-identifying observation by text or voice. Voice is optional; browser speech recognition may send audio to the browser vendor.
3. Extraction creates a **draft suggestion**, not a fact. Original text remains visible beside editable structured fields.
4. The worker confirms and submits. Submission records actor, facility, timestamp, data mode and event.
5. The assigned supervisor sees the report in a scoped review queue.
6. The supervisor may:
   - verify completeness and route the operational signal;
   - return it with a specific correction note;
   - escalate it to the appropriate designated authority with a reason.
7. The worker sees the returned note and resubmits the same report. The original and all revisions remain auditable.
8. Closure requires an explicit outcome and evidence. A verified report is not automatically “resolved”.

**[IMPLEMENTED — code]** The report state machine supports worker submission/resubmission, supervisor verification, correction request, escalation and closure with event history.  
**[VALIDATE LOCALLY]** Which cadres can submit each report type, who supervises whom, what evidence is sufficient, and which events require MO/BMO/CMHO escalation.

### B. Medicine / stock exception

1. A designated storekeeper records a physical stock observation using item, unit, batch, expiry, quantity, observation time and source.
2. BUSHO may flag a configured threshold or near-expiry condition as an **operational attention signal**. Thresholds must be approved and versioned; do not present them as national policy.
3. A designated supervisor reviews the signal and may request recount / correction or prepare an indent recommendation.
4. A facility-authorised person approves the recommendation according to the local SOP.
5. If the user manually performs the transaction in DPDMIS, BUSHO records the returned external reference and the actor/time. No API submission is implied.
6. Allocation, dispatch and receipt are recorded only with a real external reference in a real pilot, or a clearly marked synthetic reference in the test environment.
7. Storekeeper records physical receipt and discrepancy; supervisor reviews exceptions if required.
8. Reconcile the BUSHO operational record with the authoritative stock system. BUSHO is not the stock ledger of record.

**[CONFIRMED — source]** Chhattisgarh DPDMIS already has digital stock workflows. BUSHO must complement, not duplicate or replace them.  
**[IMPLEMENTED — code]** Development state machine requires supervisor indent approval, external references at DPDMIS/dispatch/receipt hand-offs, and quantity guards.  
**[VALIDATE LOCALLY]** Who physically counts, recommends, approves, submits and acknowledges stock at each facility category.

### C. Escalation and follow-up

- Every escalation has a reason, destination role/scope, due time (if approved), status and immutable event.
- BUSHO must distinguish “sent to supervisor”, “reviewed”, “referred to MO”, “external system submitted”, “allocated”, “dispatched” and “physically received”.
- A notification being delivered is not proof that the action was completed.
- Patient follow-up is represented only by a random, non-reversible demo token and coarse status. No name, phone number, address, Aadhaar, ABHA ID or free-text identifying details.

## 6. Permission rules that must be enforced server-side

1. Deny by default. UI hiding is not authorisation.
2. Active Auth account **and** active profile are required.
3. Every worker action must match a current facility assignment and task capability.
4. Supervisor queries must be scoped to assigned facilities or explicit state/district/block scope. Cross-facility visibility is never implied by a title.
5. Storekeeper stock actions must be limited to the assigned facility/store and permitted item/transaction functions.
6. Administrative roles manage only the geographic scope assigned to them.
7. Cadre metadata cannot grant permissions.
8. Role/scope/facility assignment changes are audited, time-bounded and performed by an authorised administrator.
9. A worker cannot approve their own report or their own stock recommendation.
10. A report reviewer cannot silently edit the worker’s submitted source. Corrections are returned to the author or appended as a separate review observation.
11. Clinical decisions and procurement remain outside BUSHO unless a future, formally approved workflow defines the responsible authority and safeguards.
12. No service-role key is ever sent to the browser. All privileged writes run through protected server functions / RPCs.
13. Every material transition records actor, timestamp, previous state, next state, reason/reference and relevant entity.
14. Exported demo data must retain the synthetic label and provenance.
15. Expired or revoked assignments immediately lose access.

## 7. Data classes and labels

| Data class | Example | Allowed in reference deployment? | Rules |
|---|---|---|---|
| Official administrative reference | LGD state/district/block codes | Yes, with source and snapshot date | Not a facility identity; show source age and mapping warnings |
| Official facility reference | Current DHS/NHM/CGMSC facility master | Only after received and reviewed | Preserve stable source ID, facility type, status, LGD mapping and evidence |
| Historical public facility snapshot | AAM roster dated 12-Aug-2024 | Reference-only | Never use as proof of current operation or assignable facility |
| Synthetic facility scenario | “DEMO-SHC-001” in a labelled test block | Yes | `is_synthetic=true`; never confuse with a government facility |
| Synthetic user | “Demo ANM 01” | Yes | Clearly labelled; no real person's name or credentials |
| Synthetic inventory | Batch, stock count, expiry and receipt scenario | Yes | Separate from live stock; mark every movement synthetic |
| Synthetic patient event | Random token such as `PAT-DEMO-0001`, broad event type and status | Yes, only if needed | No direct or indirect identity fields; prefer aggregate counts |
| Real patient data | Name, phone, address, ABHA, Aadhaar, identifiable diagnosis | No | Not needed for this showcase; do not collect |
| Government transaction | DPDMIS indent, allocation, challan, receipt | Only with genuine reference in authorised pilot | Never invent a real-looking reference; test references must be prefixed `DEMO-` |

## 8. First end-to-end reference slice

Build one coherent block-level showcase before attempting statewide onboarding.

**Geographic reference:** Dhamtari district (LGD 377), Dhamtari block (LGD 3625), from the committed 21-Oct-2026 LGD snapshot. This is administrative reference data, not a claim about facility coverage or operating status.

**Test-only facility scenarios (not real facilities):**
- `DEMO-SHC-AAM-001` — synthetic SHC-AAM scenario.
- `DEMO-PHC-AAM-001` — synthetic PHC-AAM scenario. The current facility-type enum needs a reviewed schema change if it is to distinguish AAM-PHC from generic PHC.
- `DEMO-JAK-001` — synthetic Jan Aushadhi Kendra scenario, held in a separate registry/tenant and not in the public-facility store model.

**Test identities:** one CHO-cadre worker, one ANM-cadre worker, one MPW/ASHA test identity only if that workflow is validated, one storekeeper, one facility reviewer, one block-scoped supervisor and one district administrator. These are synthetic identities. Their application roles and facility/scope assignments are explicit and independent of cadre.

**Walkthrough acceptance criteria:**
1. Sign in as each test identity; account role and active assignment are loaded from the server.
2. Worker can see only their assigned test facility and allowed form.
3. Worker submits a synthetic non-identifying report; a second worker cannot edit it.
4. Supervisor sees it only within assigned scope and can return it with a required note.
5. Original worker corrects and resubmits the same report; history shows both versions and events.
6. Supervisor verifies the resubmission; verification does not create an indent automatically.
7. Storekeeper enters a separate synthetic batch/stock observation; the system flags a test threshold with a visible rule version.
8. Supervisor reviews a recommendation; no procurement order is created.
9. A test DPDMIS reference is clearly marked `DEMO-`; the interface says “simulated external hand-off”, not “submitted to government”.
10. Receipt is recorded against a synthetic dispatch with quantity reconciliation.
11. Block dashboard counts only seeded synthetic records and visibly states “reference scenario — not live government data”.
12. Cross-facility and cross-scope access tests prove that each role cannot read or mutate records outside its assignment.
13. Audit history is append-only and every state transition identifies the actor.
14. Jan Aushadhi stock remains isolated from SHC/PHC/CGMSC stock.

Do not seed these records into the connected live Supabase project yet. First build a local/test seed fixture and exercise the complete flow in CI and a local browser environment.

## 9. Known schema / product gaps to resolve before implementation

- The current `profiles.role` enum is generic and does not model cadre. Add a non-authoritative cadre/designation field only after agreeing its source, allowed vocabulary and verification process.
- Part 2C.3 adds `aam_phc` as a distinct facility type in the development migration and staging validator. This is schema vocabulary only; it does not establish that a given facility is operational or grant access.
- Jan Aushadhi must not be inserted into `public.facilities` as a public AAM/CGMSC facility. Design a separate PMBJK/Kendra registry only if the scope is approved.
- Current application roles do not include Medical Officer / facility head as a distinct delegated approver. Do not silently give that authority to `supervisor`; design and test a separate capability/approval model only after local SOP validation.
- Current state machine allows a supervisor to verify a report. It does not encode the full clinical review chain. Escalation destination and closure criteria need local confirmation.
- Existing inventory state machine is a recommendation/hand-off tracker, not a stock ledger. A full batch-level ledger requires explicit stock receipt/issue/adjustment semantics and reconciliation rules.
- Part 2C.3 tightens the development RLS SELECT policy: workers retain access to their own drafts; assigned supervisors and scoped administrators do not see unsubmitted drafts. CI must verify this negative access case before the change is considered validated.
- No facility/user records or Edge Functions are deployed in connected Supabase; no real multi-user workflow has been demonstrated.

## 10. Decisions and validation questions for field discovery

Before changing policy or permissions, interview at least one representative from each relevant role at the selected facility and obtain the current local SOP:
- Which report types are actually completed by CHO, ANM, MPW and ASHA?
- Does each cadre have an individual login/device, or is assisted entry more realistic?
- Who reviews each report today, and what is the formal escalation chain?
- Who is the named store in-charge, who physically counts stock, and who approves the indent?
- Which stock actions are already mandatory in DPDMIS, and would BUSHO create duplicate entry?
- Which exception needs a separate coordination layer rather than an alert already available in DPDMIS?
- What is the approved process for facility staff changes, transfers and temporary substitutions?
- What is the minimum data needed for follow-up without patient identification?
- What connectivity, language, accessibility and device constraints exist?
- Which indicators can be shared at block/district level, and which must remain facility-only?

Record interview findings as attributed, dated observations; do not convert one person's account into statewide policy.

## 11. Implementation sequence

1. **2C.2 — role and workflow contract:** this document; review existing role claims against schema and state machine.
2. **2C.3 — policy/schema alignment:** add only the cadre metadata and capability model that is needed; decide draft visibility; add AAM-PHC type; keep Jan Aushadhi separate.
3. **2D — reference catalogues:** medicine catalogue with source/version/unit, facility import only from authoritative export, no invented operational facility count.
4. **2E — isolated demo environment:** local/CI seed fixture with synthetic identities, facility scenarios and data labels; no live Supabase writes.
5. **2F — end-to-end workflow:** worker → supervisor → storekeeper → external reference → receipt → audit; include negative cross-scope tests.
6. **2G — exception engine:** configurable, versioned stock/expiry thresholds and escalation rules; human review only.
7. **2H — showcase readiness:** localised walkthrough, accessibility/offline checks, truthful screenshots, privacy/security review and clear demo-vs-live labels.
8. **Pilot readiness (separate gate):** field validation, data-sharing approval, security/privacy review, approved facility master, formal API access, deployment plan and release approval.

**Exit condition for this blueprint:** no code change should grant a new cadre or title additional permissions until its responsibility, data access, approver and evidence requirement are written down and tested.
