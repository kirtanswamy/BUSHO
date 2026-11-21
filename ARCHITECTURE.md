# BUSHO — Architecture Overview

## Product boundary

BUSHO is a browser-based, Supabase-backed operational pilot foundation for first-mile public-health reporting and facility supply coordination. The feature branch contains authenticated role portals, PostgreSQL state constraints, row-level security (RLS), Edge Function source, reference-data review pipelines and local multi-role test tooling.

The feature branch is not the production release. The connected hosted Supabase project has not been populated with operational identities or facilities, and the feature migrations and Edge Functions have not been deployed there. No government APIs, authoritative live facility feed, approved medicine catalogue or validated physical stock are connected. Demonstrations must use explicitly synthetic operational transactions and public reference information with source/date/provenance labels.

## Application surfaces

- `index.html` — public landing page.
- `signin.html` — authenticated sign-in.
- `worker.html` — frontline reporting portal.
- `supervisor.html` — scoped report review and supply recommendation workspace.
- `storekeeper.html` — facility store allocation, dispatch and receipt workflow.
- `admin.html` — authorised user provisioning and facility registry review.
- `set-password.html` — invitation/password setup.

## Runtime and data layers

- `supabase-client.js` — browser client and authenticated data operations.
- `role-auth.js` — session lifecycle and role portal authentication.
- `report-persistence.js`, `worker-history.js` — report persistence, history and correction flows.
- `supervisor-operations.js` — supervisor report inbox, review and verification operations.
- `supervisor-supply-handoff.js` — supervisor replenishment recommendation and approval/submission-reference workflow.
- `storekeeper-portal.js`, `storekeeper-inventory-reconciliation.js` — storekeeper allocation, dispatch, receipt and reconciliation surfaces.
- `admin-portal.js`, `admin-facility-registry.js` — scoped provisioning and human-reviewed facility import.
- `supabase/migrations/` — schema, constraints, RLS, grants, append-only events and inventory movement ledger.
- `supabase/functions/` — source for provisioning and facility-registry Edge Functions; source presence does not mean deployment.
- `data/` — dated public reference snapshots and medicine source transcriptions; these are not authoritative live operational records.

## Role responsibilities

### Health worker
- Work within an authorised facility assignment.
- Create a report, inspect structured fields, confirm and submit.
- View own authenticated report history and respond to correction requests.
- Do not approve reports, manage stock or provision users.

### Supervisor
- View reports allowed by database-enforced facility/geographic scope.
- Review, request correction, verify, escalate or reject according to permitted state transitions.
- Create and approve replenishment recommendations based on eligible report and inventory references.
- Record an external DPDMIS reference only after an actual external submission; BUSHO does not submit an order to DPDMIS.

### Storekeeper
- View eligible facility supply handoffs.
- Record allocation, dispatch, partial receipt and final receipt with references and quantities.
- Does not verify worker reports or approve supervisor recommendations.

### Administrator
- Provision users only within the caller's authorised role and geographic/facility scope.
- Review staged facility registry records; imported public snapshots are not automatically promoted to assignable facilities.
- Does not bypass the source-review or authorisation gates.

## Security and audit model

- Supabase Auth supplies identity; database profiles and assignments determine active role and scope.
- RLS, column grants and database transition guards are the security boundary; hiding UI controls is not authorisation.
- Report events and inventory movements are designed as append-only evidence.
- Replenishment transitions are constrained and submission retries use a supervisor-scoped idempotency key.
- Local E2E uses synthetic identities and facilities. Never enter patient-identifiable or sensitive health data.
- Hosted production Supabase must not be used for synthetic provisioning, feature migrations or test data.

## Data and integration readiness

### Available for the pilot
- Chhattisgarh administrative reference snapshot with provenance and reconciliation flags.
- EDL 2025 source transcriptions for 278 numbered rows, all pending authorised pharmacist/CGMSC review.
- Facility registry import staging and review workflow.
- Medicine reference catalogue schema and review-decision validation.
- Local synthetic inventory/report workflows.

### Requires approval or external evidence
- Current authoritative facility master and verified facility assignments.
- Authorised medicine catalogue normalisation, units and facility applicability.
- Verified physical opening balances and complete inbound/outbound/adjustment/transfer movements.
- Government API credentials, contracts, data dictionaries and permission to connect.
- Healthcare department approval, pilot facilities and authorised users.

### Integration design principle
External systems should be connected through versioned adapters with explicit source identity, timestamps, schema mapping, idempotency, retries, stale-data handling, reconciliation and audit logs. A connector must not silently promote unverified public data into operational truth. Government integration remains inactive until the relevant authority grants access.

## Verification

- `npm run check` runs Node tests, JavaScript syntax checks and the static-server smoke suite.
- `npm run local:e2e` exercises the disposable local Supabase stack with synthetic users/data.
- `npm run test:browser` runs Playwright browser scenarios against local services.
- CI applies the database migrations and executes PostgreSQL RLS/security contracts. Keep this migration list in sync with every migration in the feature branch.
- A green CI run does not establish hosted Auth/Edge Function deployment or a real multi-user government pilot.

See `docs/local-supabase-e2e.md`, `docs/role-responsibility-permission-blueprint.md`, `docs/stock-accounting-design.md`, `docs/part-2h5-authenticated-demo-plan.md` and `docs/DEMO_SCRIPT.md`.
