# BUSHO Worker Mobile App — M0 Repository & Backend Audit

**Audit date:** 2026-11-21  
**Repository:** `kirtanswamy/BUSHO`  
**Mobile development branch:** `expo-go`  
**Scope:** Static repository and contract review only. No live Supabase data was changed and no migration was applied.

## 1. Executive finding

The repository already contains the worker-facing SHC-to-PHC workflow and its Supabase client-side contract. The `expo-go` branch currently contains the planning baseline and the existing web/backend code, but it does **not** yet contain an Expo application scaffold: there is no `apps/worker-mobile`, `app.json`, Expo Router route tree, React Native dependency, or Expo SDK dependency in the current package manifest/lockfile.

The correct next step is to add an isolated Expo app under `apps/worker-mobile/`. Do not convert the root project into a monorepo workspace and do not replace or refactor the existing web runtime as part of the mobile foundation.

## 2. Existing repository assets that the app must reuse conceptually

| Existing asset | What it establishes | Mobile treatment |
|---|---|---|
| `supabase-client.js` | Existing web REST/Auth methods and worker workflow contract | Reimplement with official `@supabase/supabase-js`; do not import the browser client into React Native |
| `supabase-config.js` | Existing project URL and public publishable-key configuration | Use environment variables in the mobile app; never copy service-role/admin secrets |
| `worker-portal.js` | Worker authentication lifecycle and history controller wiring | Preserve the worker-only role gate and lifecycle expectations |
| `worker-stockouts.js` | Existing worker stockout screen and allowed worker actions | Use as behavior reference; redesign the UI natively |
| `worker-history.js` | Worker report-history status labels and presentation rules | Preserve semantics; adapt to native components |
| `docs/shc-phc-stockout-workflow.md` | Frozen SHC-to-PHC operational workflow and limitations | Treat as a product contract |
| `supabase/migrations/*stockout*` | Database constraints, RLS, triggers and append-only case events | Backend remains authoritative; no mobile-only workflow bypass |
| `i18n.js` | Existing web translations for English, Hindi, Tamil, Telugu, Bengali and Marathi | Start mobile with reviewed English and Hindi strings; plan additional languages after terminology review |

## 3. Verified worker data contract

The current web client exposes the following relevant operations:

- `signInWithPassword(credentials)`
- `getMyProfile()` and `requireActiveProfile(['worker'])`
- `getMyWorker()`
- `getMyStockoutContext()`
- `listMyStockoutCases()`
- `createStockoutCase(input)`
- `transitionMyStockoutCase(input)`
- `listMyReports()` and the worker report-draft/history operations

The native repository layer should expose typed equivalents rather than leaking Supabase query syntax into screens.

### Identity and facility context

1. Authenticate through Supabase Auth.
2. Load the authenticated `profiles` record and require `status = active` and `role = worker`.
3. Resolve exactly one active worker record linked to the authenticated user.
4. Resolve the worker's assigned SHC from that worker record.
5. Resolve a currently effective, verified `facility_service_links` relationship for that SHC.
6. Resolve the linked PHC record.
7. If the worker, SHC, verified relationship or PHC is absent, ambiguous, expired or unavailable, show an actionable blocked state. Never infer the PHC from district, block, GPS or free text.

### Worker case operations

- Read: `stockout_cases` and related `stockout_case_events`, constrained by existing RLS.
- Create: `submitted_to_phc` only after the worker has reviewed the entered observation and the server accepts the request.
- Worker transitions supported by the current client contract: `resubmitted`, `collected_by_shc`, `partially_received_at_shc`, `discrepancy_recorded`, `no_receipt_recorded`, and `received_at_shc`.
- The app must not offer PHC review, official indent, upstream receipt or PHC handover actions. Those belong to the supervisor/storekeeper roles and are enforced by database policies and transition guards.

### Evidence and truthfulness

The UI must keep these facts separate and dated: worker observation, PHC availability observation, official indent reference, upstream receipt, PHC-to-SHC handover, SHC collection and SHC physical receipt. A typed reference is not proof that an external transaction occurred. Never label an observation as a live/official stock balance.

## 4. Important native integration decision

The existing `supabase-client.js` is a custom browser-oriented client. It uses browser session storage and manual REST/Auth request handling. It is not the right client to import into a React Native application.

The mobile app should use the supported `@supabase/supabase-js` SDK with:

- Expo-compatible session persistence, selected and tested before auth is considered complete;
- secure handling of refresh credentials and no tokens in logs or SQLite drafts;
- automatic token refresh coordinated with React Native app foreground/background state;
- the existing Supabase URL and publishable key supplied through `EXPO_PUBLIC_*` environment variables;
- existing RLS, SQL constraints and triggers as the final authorization boundary.

Do not duplicate or weaken database authorization in client code. Client role checks are for navigation and helpful errors, not security.

## 5. Recommended isolated application structure

```text
apps/
  worker-mobile/
    app/
      (auth)/
      (tabs)/
      cases/
    src/
      components/
      features/
        auth/
        home/
        stockouts/
        case-details/
        reports/
        guidance/
        settings/
      lib/
        supabase/
        query/
        storage/
        localization/
      theme/
      types/
    assets/
    app.config.ts
    package.json
    tsconfig.json
```

Keep the root web app and its npm scripts intact. The mobile app should own its dependencies and scripts. Share stable domain types or pure validation helpers only after their contracts are covered by tests; do not share DOM code or browser-specific modules.

## 6. M0 audit outcome

**Completed in this static audit**
- Confirmed that the `expo-go` branch exists and is the intended isolated mobile-development branch.
- Confirmed that the native Expo app has not yet been scaffolded.
- Identified the existing worker Auth, facility-context, stockout, report-history and database-contract assets.
- Identified the browser-only Supabase client boundary and the need for a native SDK client.
- Reconfirmed the worker/supervisor/storekeeper role separation and the no-patient-data / no-authoritative-stock-balance guardrails.

**Still required before M1 can be called complete**
- Verify a synthetic worker account and synthetic SHC-to-PHC fixture in the local/test Supabase environment.
- Run the existing PostgreSQL/RLS contract suite against the exact branch revision used for app integration.
- Confirm the installed Expo Go client version on the target Android device, then choose the compatible stable Expo SDK.
- Scaffold the isolated app, run `npx expo-doctor`, and add CI typecheck/lint/unit-test gates.
- Test the selected Supabase Auth storage adapter for refresh, process restart, sign-out and account-switch behavior.

## 7. Branch and commit discipline

- All native app code, mobile docs and mobile-specific tests are committed to `expo-go`.
- Keep commits small and milestone-scoped, e.g. `feat(mobile): scaffold worker Expo app`, `feat(mobile-auth): add secure Supabase session`.
- Do not commit `.env`, credentials, synthetic account passwords, service-role keys, real worker data or patient information.
- Do not apply migrations to hosted/production Supabase as part of app scaffolding.
- Do not merge the mobile branch into `main` until mobile release gates and the web/backend compatibility review pass.

## 8. Current next milestone

**M1 — Expo foundation:** create the isolated Expo Router + TypeScript app in `apps/worker-mobile/`, establish design tokens and navigation, configure environment validation, add a native Supabase client with tested session persistence, and implement a worker-only authenticated route gate. No operational stockout writes until M2/M3 tests and the backend contract are green.
