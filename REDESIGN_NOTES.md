# BUSHO redesign pass — 2026-11-03

## Decisions implemented
- Common landing page retained; portal selection moved to a dedicated `signin.html`.
- Health Worker and Supervisor continue to have separate entry/login pages.
- Health Worker portal now has its own sidebar navigation, desktop layout, and mobile bottom navigation.
- Supervisor portal now has a separate operations sidebar with Reports Inbox, Health Trends, Inventory, Facilities, Health Workers, Approvals, and Activity Log.
- Supervisor workspace is restyled as a light enterprise interface with a navy navigation sidebar.
- Worker and supervisor screens are role-scoped in their respective pages; the shared extraction engine is retained.
- Added synthetic demo overview, report-history, inbox, trend, facility, worker, and approval module views.
- Added smoke assertions for role-specific navigation and separate report modules.

## Important limitations
- The login is still a client-side demo credential gate, not secure production authentication.
- Module records outside the existing extraction/dashboard workflow are illustrative synthetic demo content.
- There is no shared production database, server-side role authorization, or live facility integration.
- Browser screenshots/manual testing at desktop and mobile breakpoints remains required before deployment.
- Do not enter real patient-identifiable or sensitive health information.

## Validation
- `npm run check` passes.
- Existing extraction tests: 6/6 passing.
- Smoke checks pass, including route separation, asset loading, localization parity, and server hardening.
- `git diff --check` passes.
