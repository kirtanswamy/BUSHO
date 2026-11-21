# BUSHO Worker Mobile App — Product & Engineering Plan

**Status:** Planning baseline  
**Repository:** `kirtanswamy/BUSHO`  
**Development branch:** `expo-go`  
**Base:** `feature/chhattisgarh-operational-workflow`  
**Product scope:** Worker-only Android/iOS app; supervisor and storekeeper remain web workspaces for this milestone.

## 1. Product intent

Build a genuinely mobile-first companion for the frontline SHC worker (CHO/ANM) to record and follow an SHC-to-PHC medicine stockout exception with the least possible friction, including on low-end Android devices and unreliable connections.

The app is not a smaller copy of `worker.html`. It should optimize for field tasks: see assigned facility context, capture a physical stockout observation, understand whether it has actually been sent, respond to a PHC clarification, record collection, and confirm physical receipt or discrepancy.

### Primary success measures

- A worker can understand the next action without training or interpreting technical status codes.
- A stockout observation can be drafted with poor or no connectivity without falsely claiming it was submitted.
- Submission is permitted only when the authenticated worker, assigned SHC, and current verified parent-PHC relationship are confirmed by the backend.
- Every status, quantity, handover, receipt, and external reference remains evidence-based and traceable.
- Core tasks are usable with large text, screen readers, keyboard/switch navigation where applicable, and one-handed operation.

## 2. Non-negotiable product and governance boundaries

The mobile app inherits the BUSHO Workflow Freeze v1.0 and the existing SHC-to-PHC database contracts.

- BUSHO is an assistive coordination/evidence layer. It does not replace official paper registers, procurement authority, or official stock systems such as DPDMIS/CGMSC.
- Never present an authoritative or live stock balance. Show dated observations and recorded evidence only.
- Never infer a worker's SHC or parent PHC from district, block, GPS, or a user-entered label. Require the active worker assignment and current verified `facility_service_links` relationship.
- Do not add supervisor or storekeeper actions to the worker app. Role boundaries are enforced by Supabase RLS and database transition guards, not just hidden UI.
- Do not create, approve, or edit facility links from the mobile client.
- No patient names, phone numbers, ABHA IDs, diagnoses, prescriptions, or patient-identifiable information. Keep the workflow medicine-stockout operational only.
- Preserve the separation between PHC availability observation, official indent reference, upstream receipt, PHC handover, SHC collection, and SHC physical receipt.
- Typing an external reference does not prove that an official transaction occurred.
- Synthetic/demo accounts and facilities must be visibly labelled as synthetic in every relevant screen. Never mix synthetic and operational facility records.

## 3. Recommended technology

| Layer | Recommendation | Reason |
|---|---|---|
| Runtime | Expo + React Native + TypeScript | One native Android/iOS codebase and fast field-device iteration |
| Navigation | Expo Router | File-based, typed route structure and predictable deep links |
| Backend | Existing Supabase project and migrations | Reuse the existing Auth, Postgres, RLS, triggers, and workflow contracts |
| Supabase client | `@supabase/supabase-js` | Supported client for React Native; no service-role key in the app |
| Auth persistence | Expo SecureStore-backed storage adapter | Keep refresh/session credentials out of ordinary app state |
| Server state | TanStack Query | Query caching, explicit stale/loading/error states, controlled refetch |
| Forms | React Hook Form + Zod | Predictable validation and accessible field-level errors |
| Offline drafts | Expo SQLite | Local draft persistence and an explicit pending-sync boundary |
| Localization | `expo-localization` + an i18n library | Start with English and Hindi; add Chhattisgarhi only with reviewed translations |
| UI | Native React Native components and a small BUSHO token system | Consistent, responsive, accessible and low-overhead UI |
| Tests | Jest / jest-expo + React Native Testing Library | Unit and component-level confidence; add device smoke automation separately |

Use the latest stable Expo SDK that is compatible with the installed Expo Go client at implementation time. Install Expo-managed packages with `npx expo install` and run `npx expo-doctor`; do not pin arbitrary React Native package versions manually.

Expo Go is the initial development runtime, not a permanent constraint. Avoid custom native modules in the first milestone. When requirements need native capabilities that Expo Go does not bundle, move to an Expo development build/EAS without changing the product architecture.

## 4. Worker information architecture

Keep the primary navigation shallow. A bottom tab bar is preferred for the four most frequent destinations, with the active task and facility context always easy to find.

1. **Home** — assigned SHC and verified parent PHC, connection state, action-needed summary, primary “Report stockout” action, recent activity.
2. **My Requests** — active and closed cases, human-readable statuses, filters that work on small screens.
3. **Report** — a short, progressive form for a physical observation.
4. **Guidance** — simple workflow explanation, what evidence to record, privacy reminder, contact/escalation guidance.

Case detail is opened from Home or My Requests and presents a chronological, accessible activity timeline. Do not add a fifth tab for profile; account, language, accessibility and sign-out live in a simple account sheet.

### Primary worker journey

1. Sign in with the account provisioned for the worker.
2. Resolve the active profile, worker record, assigned SHC, and current verified parent PHC.
3. If the relationship is missing, expired, ambiguous, or not verified, explain the issue and disable submission. Never guess the PHC.
4. Capture the medicine name and strength/form, observed quantity, requested quantity, unit, observation source, observation time, and optional operational note.
5. Review the draft and submit while online.
6. Show a confirmed server response and the returned case reference/status. If no server confirmation was received, do not show “Sent”.
7. Follow PHC updates and answer a clarification request when present.
8. Record SHC collection reference only after physical collection.
9. Record cumulative physical receipt and the required receipt/no-receipt reference. Require a reason for zero or short receipt.
10. Show closure only when the backend records the corresponding terminal state.

## 5. Screen and interaction requirements

### Home
- Greeting and worker name, with the assigned SHC shown as the main context.
- Parent PHC shown as a verified relationship with an explicit “verified as of” date where available.
- Connection banner with three distinct states: Online, Offline, and Reconnecting.
- A compact “Needs your action” section for clarification, collection confirmation, and receipt confirmation.
- One prominent primary action; avoid dashboard KPI overload.

### Report stockout
- Progressive sections: Medicine, Physical observation, Requested quantity, Evidence, Review.
- Numeric keypad for quantities; unit selection with clear labels.
- Do not default a quantity to a fabricated value. Require an explicit observation; allow zero only when it is a real physical observation.
- Show helper text for each observation source.
- Keep optional note optional, short, and explicitly warn against patient information.
- Preserve the original user-entered observation in the review step; never silently rewrite it.

### Request details
- Human-readable status and a plain-language explanation of what happened and what the worker can do next.
- Separate “PHC availability observed”, “official indent reference recorded”, “PHC handover”, and “SHC receipt” facts.
- Chronological event timeline with actor role, timestamp, evidence reference, and note where available.
- Make stale or missing data visible; never imply real-time stock synchronization.

### Clarification, collection and receipt
- Only show an action when the backend state allows that worker transition.
- Explain why the action is available and what evidence is required.
- Validate cumulative receipt against recorded PHC handover quantity and previous receipt.
- Do not let a worker alter PHC-only decisions or storekeeper-only official references.

## 6. Offline and synchronization model

Offline support must be honest and conservative.

**Phase 1 offline behavior**
- Cache only the minimum worker context and previously loaded case summaries needed for read-only viewing.
- Allow a new observation to be saved as a local draft in SQLite.
- Label every local draft: **Saved on this device — not sent to PHC**.
- Keep a visible last-synced timestamp and a manual retry affordance.
- Do not optimistically change a server case status or claim that a submission/transition succeeded without a successful server response.
- Do not queue irreversible workflow transitions for automatic background replay in the first release.

**Later offline milestone**
- Evaluate a durable outbox only after conflict handling, idempotency, expiry, device-loss, sign-out, and audit behavior are specified and tested.
- Before replaying any action, re-authenticate, re-fetch the case, verify current status and facility relationship, validate the action against the current state, and require explicit worker confirmation when the action may have become stale.
- Duplicate submissions must be prevented with a server-supported idempotency design; client-generated IDs alone are not sufficient.

## 7. Security and privacy architecture

- Use only the Supabase project URL and publishable key in the app. Never embed service-role keys, admin secrets, or privileged function credentials.
- RLS, SQL constraints, triggers, and server-side role checks remain authoritative.
- Use SecureStore for auth-session persistence; do not put tokens in SQLite, logs, analytics, crash reports, or AsyncStorage.
- Clear local user-scoped caches and drafts on sign-out, account switch, or account revocation, with a clear confirmation when unsent drafts would be lost.
- Do not log raw notes, credentials, auth tokens, or operational record payloads.
- Use HTTPS only. Do not add third-party analytics, advertising, trackers, or crash reporting SDKs without a documented privacy/security review.
- Request only permissions that are essential. No location, contacts, camera, microphone, or media permission in the first milestone.
- App screens must display a concise privacy reminder and a clear support route for account/facility assignment problems.

## 8. Accessibility and field usability

Target WCAG 2.2 AA principles where applicable, plus native platform accessibility behavior.

- Dynamic text scaling without clipped labels or broken forms.
- Minimum comfortable touch targets (aim for 48 dp), generous spacing, and one-handed reach.
- High contrast, semantic status labels, and no color-only status communication.
- Screen-reader labels, hints, grouping, logical focus order, and announcements for validation and submission results.
- Plain language; avoid acronyms unless expanded on first use.
- Clear field labels that remain visible while typing; never use placeholder-only labels.
- Large, readable dates and quantity units; local date/time display in Asia/Kolkata.
- Reduced-motion support and no essential information conveyed only through animation.
- Test with Android TalkBack, large font/display settings, high contrast, and low-end Android devices.

## 9. Architecture and proposed project structure

Keep the mobile app isolated from the existing web runtime while sharing the same repository and backend contracts.

```text
apps/
  worker-mobile/
    app/                    # Expo Router routes and layouts
    src/
      components/           # Accessible reusable UI
      features/
        auth/
        home/
        stockouts/
        case-details/
        guidance/
        settings/
      lib/
        supabase/
        storage/
        query/
        localization/
      theme/
      types/
    assets/
    app.config.ts
    package.json
    tsconfig.json
docs/
  MOBILE_WORKER_APP_PLAN.md
```

The initial app should be a focused worker client, not a monorepo migration. Keep root web scripts and existing HTML/JS behavior intact. A shared package can be introduced later only if it genuinely reduces duplication without coupling the web app to React Native.

## 10. Delivery milestones and exit criteria

### M0 — Product and backend contract audit
- Map the current worker web journey to existing tables, RLS policies, triggers, and allowed transitions.
- Confirm Auth provisioning and test-account strategy.
- Confirm the Expo Go SDK/device compatibility and app identifier.
- No production schema changes.

**Exit:** reviewed API/data contract and an agreed list of worker-only actions.

### M1 — Foundation
- Expo Router, TypeScript, theme tokens, fonts, safe areas, app configuration.
- Secure Supabase Auth persistence and role gate.
- Synthetic test environment indicator.
- CI: lint, typecheck, unit tests, Expo Doctor.

**Exit:** worker can sign in with a synthetic test account and sees only worker routes.

### M2 — Home and facility context
- Load profile, worker assignment, verified SHC-to-PHC link.
- Honest online/offline/reconnecting states.
- Clear empty, loading, error, stale, and unverified relationship states.

**Exit:** no submission path when worker assignment or current verified parent-PHC link is absent.

### M3 — Stockout capture
- Accessible progressive form and local draft save.
- Review-before-submit and server-confirmed success state.
- Tests for validation, duplicate taps, network failures, and role denial.

**Exit:** synthetic worker can create a valid stockout case through existing backend rules.

### M4 — My Requests and case details
- Server-backed list, event timeline, status explanation.
- Clarification response, collection confirmation, cumulative receipt/discrepancy actions.

**Exit:** all worker-allowed transitions work and supervisor/storekeeper-only actions are inaccessible and rejected server-side.

### M5 — Offline hardening and field QA
- Local drafts, reconnect behavior, stale context handling, cache expiry and sign-out cleanup.
- TalkBack, large text, contrast, low-bandwidth and device testing.

**Exit:** offline state never masquerades as a server submission; no data loss or duplicate action in tested scenarios.

### M6 — Release readiness
- Privacy/security audit, dependency and SDK audit, permissions review.
- EAS development/preview build, Android device matrix, crash-free smoke tests.
- Store listing, support process, privacy policy, release and rollback plan.

**Exit:** explicit product-owner approval, operational validation, and production release checklist completed.

## 11. Testing strategy

- Unit tests for worker state transitions, validation, date handling and offline draft rules.
- Component tests for forms, focus behavior, error summaries, status announcements and text scaling.
- Integration tests against local Supabase with synthetic fixtures and the existing PostgreSQL/RLS contracts.
- Negative authorization tests: worker cannot read another SHC's records or perform supervisor/storekeeper transitions.
- Network tests: timeout, 401/session expiry, 403/RLS denial, 409/conflict, server error, offline and reconnect.
- Device acceptance on at least one low-end Android device and one current Android device; iOS compatibility checks when available.
- No test may depend on real patient data or unverified live facility records.

## 12. Decisions to confirm before implementation

1. **Initial backend mode:** use the existing Supabase schema with synthetic E2E accounts and fixtures for development; no production data or migrations until separately approved.
2. **First target:** Android-first through Expo Go, with iOS-compatible layout and navigation from day one.
3. **Language launch:** English and Hindi initially; Chhattisgarhi only after a native speaker reviews terminology.
4. **Offline scope:** local draft capture and read-only cached cases first; defer automatic workflow-action sync.
5. **Visual direction:** create and review three mobile screen directions before implementing the visual system. Keep the BUSHO identity, but prioritize calm, high-contrast field usability over decorative dashboard styling.

## 13. Initial implementation commands

Run these from the repository root after reviewing the plan and selecting the visual direction:

```bash
npx create-expo-app@latest apps/worker-mobile
cd apps/worker-mobile
npx expo install
npx expo-doctor
npx expo start
```

Install additional Expo-managed native packages with `npx expo install <package>`. Add the Supabase client, SecureStore adapter, SQLite draft storage, form validation and query cache in separate reviewed commits. Do not copy production secrets into `.env` or commit local environment files.
