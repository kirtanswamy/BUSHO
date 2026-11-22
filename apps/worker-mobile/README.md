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
