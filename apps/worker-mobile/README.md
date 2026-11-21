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

Foundation only: Expo entry, light-first/high-contrast tokens, A-/A/A+ type scale, reusable primitives, canonical shield, and chunked SecureStore-backed Supabase client. Operational screens and workflow writes are intentionally out of scope.
