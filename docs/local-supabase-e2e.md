# BUSHO Local Supabase E2E

This document describes the local-only integration and browser test workflows for BUSHO.

These workflows use synthetic data and a local Supabase stack. They must not be pointed at a hosted or production Supabase project.

## Prerequisites

- Docker Desktop or another compatible Docker runtime.
- Supabase CLI.
- Node.js 18 or newer.
- Dependencies installed with `npm ci`.
- Repository checked out on `feature/chhattisgarh-operational-workflow`.

## 1. Start the local Supabase stack

From the repository root:

```powershell
npx supabase start
npx supabase status
```

Confirm the local API is available at:

`http://127.0.0.1:54321`

The browser runner independently checks the local Auth health endpoint and validates the local publishable key.

Do not run `supabase link` as part of this workflow.

## 2. Local API integration E2E

The API runner is:

`scripts/local-supabase-auth-smoke.mjs`

It requires these environment variables:

- `API_URL`
- `ANON_KEY`
- `SERVICE_ROLE_KEY`

Set them in the current PowerShell session using values from the local `supabase status --output env` output. Do not commit or print their values.

Example:

```powershell
$env:API_URL = "http://127.0.0.1:54321"
$env:ANON_KEY = "<local anon key>"
$env:SERVICE_ROLE_KEY = "<local service role key>"

node .\scripts\local-supabase-auth-smoke.mjs
```

The runner creates six synthetic Auth users across two synthetic facilities. After all API assertions pass, it writes the exact account emails, shared synthetic password, and generated Facility A/Facility B IDs to the Git-ignored `.local-e2e/credentials.json` file. The password is never printed. The runner refuses any `API_URL` other than `http://127.0.0.1:54321`.

The credentials file is the handoff between the API process and the separate browser-provisioning process. It is local-only and must not be committed, uploaded, or pasted into logs or messages.


- Worker A and Supervisor A, assigned to Facility A.
- Worker B and Supervisor B, assigned to Facility B.
- Storekeeper A assigned to Facility A.
- Storekeeper B assigned to Facility B.

It exercises:

### Authentication and facility isolation

- Local Supabase Auth health.
- User creation and password authentication.
- Server-side profile provisioning.
- Active profile and facility assignment checks.
- Cross-facility isolation.

### Worker and supervisor reporting

- Worker draft creation and privacy before submission.
- Same-facility supervisor visibility after submission.
- Report correction requests with mandatory reasons.
- Structured report-item correction and resubmission.
- Event history and audit metadata.
- Supervisor reverification.
- Unauthorized self-verification and cross-facility review denial.

### Replenishment and storekeeper workflow

- Supervisor-only indent recommendation.
- Clarification return authorization and mandatory reason.
- Rejection of clarification returns after DPDMIS submission.
- Supervisor approval and DPDMIS reference recording.
- Storekeeper-only allocation and dispatch.
- Receipt-reference validation.
- Over-receipt rejection.
- Partial and final goods receipt.
- Inventory movement delta reconciliation.
- Idempotent receipt retry.
- Duplicate external receipt-reference rejection.
- Append-only event and inventory ledger protections.
- Inventory catalogue and snapshot authorization.
- Assignment revocation, restoration, and suspended-profile access checks.
- Privilege escalation and assignment tampering denial.

All test users, facilities, reports, inventory records and references are synthetic.

### Fixture retention

The API runner intentionally retains synthetic test data. Its `finally` block reports the run identifier, user count, facility count and synthetic report marker.

This is deliberate: workflow history is append-only and deleting the report may conflict with database safeguards.

Do not assume the runner cleans up its users or records.

## 3. Browser authentication and operational E2E

The browser runner is:

`scripts/run-local-browser-e2e.ps1`

Run the API integration runner successfully first so it creates `.local-e2e/credentials.json`. Then run the browser runner from the repository root:

```powershell
.\scripts\run-local-browser-e2e.ps1
```

It:

1. Validates `.local-e2e/credentials.json`, fixture `a204be7a`, the exact local API URL, and the six baseline account labels created by the API runner: `worker-a`, `supervisor-a`, `worker-b`, `supervisor-b`, `storekeeper-a`, and `storekeeper-b`.
2. Confirms the credentials file is ignored by Git.
3. Reads the local publishable key from `npx supabase status --output env` and checks the local Supabase Auth health endpoint.
4. Runs `scripts/provision-storekeeper-e2e.ps1`. This derives the current run suffix and Facility A ID from the credentials file, then creates or reuses The dedicated `storekeeper-e2e` identity and verifies its active storekeeper profile and Facility A assignment.
5. Runs `scripts/provision-stockout-e2e.ps1` to create or reuse the four SHC-to-PHC synthetic accounts and facilities. When reusing its fixed `.example.test` accounts, the provisioner reapplies the current run's generated password so a fresh API fixture run does not leave stale browser credentials.
6. Verifies all seven baseline and four stockout account labels.
7. Temporarily sets `BUSHO_LOCAL_PUBLISHABLE_KEY` and runs Playwright using `playwright.config.mjs`.
8. Restores both `BUSHO_LOCAL_PUBLISHABLE_KEY` and `PORT` to their previous values.

The seven browser accounts cover two workers, two supervisors and three storekeeper identities. The dedicated `storekeeper-e2e` account is generated for the same API fixture run and assigned to its actual synthetic Facility A; no hardcoded facility UUID is used.

The credentials file is local-only and must never be committed, uploaded, or pasted into logs or messages.

The browser suite covers portal initialization, authentication, role restrictions, suspended-account behavior, report correction and verification, the synthetic storekeeper replenishment journey, and the SHC-to-PHC stockout workflow.

### SHC-to-PHC stockout browser journeys

The stockout browser fixtures provision synthetic SHC worker, PHC supervisor and PHC storekeeper identities, plus a separate storekeeper assigned to another PHC. The browser tests exercise:

- Worker submission routes to the current verified parent PHC; the application refuses to guess a parent PHC when no verified link exists.
- Direct PHC fulfilment: supervisor review, storekeeper physical availability observation and handover, worker collection and cumulative physical receipt, then supervisor closure.
- Upstream fulfilment: PHC non-fulfilment, a synthetic official-indent reference, a separately recorded physical upstream receipt at PHC, PHC-to-SHC handover, SHC receipt and supervisor closure.
- Zero physical receipt after confirmed collection: worker records a zero-receipt register reference and explanation, then a later positive cumulative receipt is recorded while the original zero-receipt event remains in history, followed by supervisor closure.
- Role and facility boundaries, including denial of access to cases assigned to another PHC.

All identities, facilities, medicines and external references in these journeys are synthetic. The DPDMIS/official-indent references are evidence entered after a hypothetical external action; BUSHO does not submit an indent to DPDMIS or contact a government system. These tests run against local Supabase only and do not validate hosted Auth or production configuration.

The operational browser journey verifies:

- Worker creates and submits a synthetic report.
- Supervisor requests a correction with a reason.
- Worker edits and resubmits the same report.
- Supervisor reviews and verifies the corrected report.
- Users sign out through the profile menu when switching roles.

The storekeeper replenishment browser journey verifies:

- A synthetic worker report is submitted and verified.
- A replenishment request is created for the synthetic facility.
- The supervisor approves the request and records a synthetic DPDMIS reference.
- The assigned storekeeper allocates and dispatches the requested quantity.
- The storekeeper records a partial receipt followed by the final cumulative receipt.
- Inventory movement deltas are reconciled and a repeated final receipt does not create a duplicate movement.

The replenishment request is created through the authenticated application client in the test, rather than through a complete browser-based request-creation flow. The DPDMIS reference is synthetic and recorded only; the test does not submit an order to DPDMIS or contact a government system.

The browser suite uses the local Supabase stack. It must not make requests to a hosted Supabase project.

## 4. Test and verification commands

Run the project checks:

```powershell
npm run check
```

Run browser E2E separately:

```powershell
.\scripts\run-local-browser-e2e.ps1
```

The API integration runner must be run first after its three environment variables have been set. A successful run writes the Git-ignored credentials handoff used by the browser provisioners:

```powershell
node .\scripts\local-supabase-auth-smoke.mjs
```

Then run the browser runner to provision The dedicated replenishment account, the SHC-to-PHC accounts, and execute Playwright:

```powershell
.\scripts\run-local-browser-e2e.ps1
```

Review Playwright output and `test-results` when browser tests fail.

## 5. Recovery and database safety

Do not automatically reset the local database after an interrupted test.

The API runner intentionally retains synthetic fixtures and append-only audit history. A reset destroys local database data, including fixtures and other local test state.

Only run:

```powershell
npx supabase db reset
```

when you deliberately intend to discard ALL local database data and rebuild the local database from migrations.

Before resetting:

- Confirm the Supabase CLI is operating on the local stack.
- Confirm the project is not linked to a hosted project.
- Confirm no local data or evidence needs to be retained.
- Understand that local database contents will be lost.

Never use `--linked` or a remote database target for this workflow.

## 6. Safety boundary and limitations

- Use synthetic test identities and synthetic operational records only.
- Do not use patient-identifiable information or real facility rosters.
- Do not place credentials, access tokens or API keys in Git.
- Do not run `supabase link`, `supabase db push`, `supabase db reset --linked`, or `supabase functions deploy` as part of local E2E testing.
- Do not interpret a passing local test as proof of production readiness.
- Hosted non-production validation, external-system integration, real facility data verification and operational review require separate authorization and validation.

A passing local run demonstrates behavior against the local Supabase schema, policies, triggers and application workflows only.
