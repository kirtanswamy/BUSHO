# BUSHO — Impact & Implementation Plan

## 1. Social problem

Frontline health teams may communicate service trends and medicine-stock concerns through fragmented or inconsistent reports. When information is incomplete or difficult to compare, administrators may have less timely visibility into issues that deserve review.

BUSHO explores a structured path from field reporting to human-reviewed operational records and administrator-reviewed stock-action drafts.

## 2. Intended users and stakeholders

- **Frontline health workers:** enter or review a field report and confirm the structured details.
- **Facility or store staff:** review stock information and identify records that may need attention.
- **Public-health administrators:** assess verified reports and decide whether follow-up is appropriate.
- **Communities:** may benefit indirectly if a future validated workflow supports more responsive essential-medicine service delivery.

These are intended stakeholder groups; the prototype has not yet been validated with them.

## 3. Potential value

| Workflow stage | Potential value | Safeguard |
| --- | --- | --- |
| Structured reporting | More consistent fields for review | Keep original note visible |
| Human correction | Clear responsibility for confirmation | Never treat extraction as clinical truth |
| Stock attention signal | Highlight records that may deserve checking | Validate against an authoritative, current stock source |
| Administrator draft | Organize follow-up for a decision-maker | No automatic ordering or procurement action |

Potential benefits are hypotheses to evaluate, not measured outcomes.

## 4. Sustainable Development Goals

- **SDG 3 — Good Health and Well-Being:** intended alignment through improved health-service workflow coordination.
- **SDG 10 — Reduced Inequalities:** intended alignment through a concept focused on frontline service delivery and communities that may face barriers to consistent access.

Alignment does not establish measured progress toward either goal.

Official references:
- https://sdgs.un.org/goals/goal3
- https://sdgs.un.org/goals/goal10

## 5. Current prototype boundary

The current browser demonstration uses synthetic examples, client-side mock/rule-based extraction, and browser-local storage. It does not have live AI inference, a shared production backend, authentication, live government or facility inventory feeds, or real ordering. No field pilot, user study, or measured impact has been completed.

Never enter real patient-identifiable or sensitive health information into the demo.

## 6. Proposed phased implementation

### Phase 1 — Validate the workflow
- Conduct structured walkthroughs with frontline workers, store staff, and administrators.
- Confirm required report fields, terminology, correction steps, and escalation responsibilities.
- Record usability issues and revise the workflow.

### Phase 2 — Build a secure pilot foundation
- Implement authenticated access and role-based permissions.
- Add a protected backend, database, audit trail, backups, and retention controls.
- Complete privacy, security, and clinical/operational risk reviews before handling sensitive data.

### Phase 3 — Integrate trusted data
- Obtain formal approval and technical documentation for each inventory source.
- Define data ownership, update frequency, error handling, and reconciliation.
- Keep source timestamps visible and show when stock data is stale or unavailable.
- Require an authorized person to approve any operational action.

### Phase 4 — Evaluate before scaling
- Run a supervised pilot with synthetic data first, then approved operational data only after safeguards are in place.
- Compare baseline and pilot workflows.
- Document limitations, failures, corrective actions, and stakeholder feedback.

## 7. Proposed evaluation metrics

No results have been measured yet. A future pilot could evaluate:
- Report completion time.
- Completeness of required fields.
- Frequency and types of human corrections.
- Time from a reported stock concern to administrator review.
- Percentage of stock signals confirmed by an authoritative source.
- User-rated clarity and usefulness.
- False alerts, missed alerts, and data-quality issues.

Metrics should be defined with pilot stakeholders before data collection.

## 8. Key risks and controls

| Risk | Proposed control |
| --- | --- |
| Incorrect extraction | Preserve source note; human correction and confirmation |
| Stale or inaccurate inventory | Source timestamp, validation, reconciliation and stale-data warning |
| Sensitive data exposure | Data minimization, access controls, encryption, retention policy and review |
| Unauthorised procurement | No automatic orders; explicit authorized approval |
| Workflow mismatch | Co-design and supervised usability testing |
| Overstated impact | Report measured results only; label assumptions and synthetic examples |

## 9. Success criteria for a pilot

Agree on baseline measures, acceptable error thresholds, user consent and oversight, data protection responsibilities, escalation procedures, and stop conditions before starting. Scale only if the pilot shows safe, useful performance and the responsible health authorities approve the next stage.
