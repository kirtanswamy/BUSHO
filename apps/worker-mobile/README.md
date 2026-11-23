# BUSHO SHC Health Worker Mobile

An Expo Go-compatible React Native app for the SHC health-worker workflow. This app is isolated from the root BUSHO web application.

## Guardrails

- Run this package from this directory; do not add mobile dependencies to the repository root.
- Expo SDK 58 / React Native 0.88; no custom native prebuilds or custom native modules.
- Supabase is authoritative for identity, access, workflow state, and audit history.
- Auth sessions use chunked Expo SecureStore. Operational drafts/queues must never contain auth tokens.
- Do not run or add hosted/production database migrations from this app branch.
- No patient-identifiable data, diagnoses, or clinical encounter records.
- Do not infer CHO/ANM cadre from the app role.
- No medicine catalogue or EDL quick-picks until state mappings are verified and approved.
- Fixed unit chips are a UI convenience, not a medicine master.
- Interrupted writes are uncertain until reconciled against the server; never silently retry.
- Quantities are dated physical observations, never official/live inventory.
- Show Synthetic Pilot whenever synthetic records are active.

## Local setup

1. Use Node.js 20 LTS or a version supported by the pinned Expo SDK.
2. Copy `.env.example` to `.env`; set the Supabase URL and publishable key. Never use a service-role key in an Expo public variable.
3. From this directory run:

   ```sh
   npm install
   npx expo install --check
   npm run typecheck
   npx expo-doctor
   npm start
   ```

4. Open with a matching Expo Go SDK 58 client on Android or iOS.

Use `npx expo install` for future Expo-managed dependencies and commit the generated package-local lockfile.

## M1.1 status

Foundation: Expo entry, light-first/high-contrast tokens, A-/A/A+ type scale, reusable primitives, canonical shield, and chunked SecureStore-backed Supabase client.

## M1.2 status

Authentication and worker identity gate implemented:

- Password sign-in through Supabase Auth; no public sign-up.
- Session restoration and refresh using the package's SecureStore adapter.
- Access requires an active `profiles` row with role `worker`.
- Requires exactly one active worker row linked by `auth_user_id`, with worker role.
- Requires exactly one current active `user_facility_assignments` row for that worker's facility and role.
- Requires the linked facility to be active and verified.
- Access-denied and verification-unavailable states are distinct; sign-out is available.
- Synthetic facilities display a persistent `Synthetic Pilot` marker on the authenticated screen.

This milestone does not create or modify database schema, does not provision users, and does not yet expose stockout or field-update workflows. A missing verified SHC-to-PHC service link does not block sign-in; it will gate stockout workflow access separately.


## M1.3 status

Worker application shell added:

- Four-tab navigation: Home, Stockouts, Field Updates, Facility & Profile.
- Verified workers are routed into the authenticated shell.
- Home identifies the assigned facility and access-verification state.
- Stockouts and Field Updates currently show explicit not-yet-connected states; they do not fabricate cases, counts, stock levels, or submission success.
- Facility & Profile shows the verified worker/facility identity and provides sign-out.
- Synthetic Pilot remains visible for synthetic facility records.

M1.3 does not yet connect operational stockout or receipt-evidence queries. Those require schema/workflow verification before implementation.


## M1.4 read-only stockout integration

- Stockouts tab reads cases from `stockout_cases` scoped to the signed-in worker and assigned SHC; database RLS remains authoritative.
- The screen checks the current verified SHC-to-PHC service link and verifies the linked PHC record before displaying readiness.
- Case cards show the recorded medicine, strength/form, observed/requested quantities, observation date, status, and synthetic-data marker.
- Field Updates reads the immutable `stockout_case_events` timeline for the signed-in worker's cases.
- Pull-to-refresh and explicit retry are available. No local case counts or fabricated events are generated.
- Case creation and updates are intentionally not enabled: the demo database currently grants `SELECT` but not `INSERT` or `UPDATE` on `stockout_cases` to the authenticated role. Existing RLS policies alone do not grant table privileges. A reviewed database permission change or narrowly scoped server-side operation is required before enabling writes.
- No database schema, grants, RLS policies, seed data, or production settings were changed by M1.4.


## M1.5 status — worker stockout submission

- Stockouts includes a guarded submission form for medicine name, strength/form, observed/requested quantities, fixed unit chips, observation source, local observation date, and a short non-patient note.
- Submissions are sent directly to the existing `stockout_cases` table with the verified SHC, PHC, worker, and matching operational/synthetic data mode. The database transition guard and RLS policies remain authoritative.
- The app does not use a medicine catalogue, infer medicine standards, collect patient information, or claim official procurement.
- Only explicit submission to PHC is offered. Draft editing is not represented as complete in this milestone.
- A worker-scoped local attempt marker is written before the network request. If the request is interrupted, the app queries the server using that exact case UUID and does not automatically retry or generate a second case.
- The demo project's authenticated role has table-level `INSERT` and `UPDATE` on `stockout_cases`; RLS remains enabled and existing role/ownership policies and database transition/field-ownership triggers remain in force. No DELETE grant was added. This permission change was applied directly to BUSHO-Demo only; it was not applied to BUSHO production and is not yet represented by a checked-in migration.
- No schema, columns, workflow triggers, RLS policies, or production settings were changed.
- Before enabling writes in any other environment, review and promote the exact grants through a version-controlled migration.
