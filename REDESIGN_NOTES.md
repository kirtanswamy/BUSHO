# BUSHO portal redesign — second pass

## Changes
- Removed the duplicate center "Public website" navigation; the BUSHO brand now links home.
- Removed the duplicate sidebar brand mark and redundant sidebar public-site link.
- Added accessible profile dropdowns to both role portals with account, facility, preferences, privacy and red sign-out actions.
- Removed duplicate footer language selection; the header language selector remains.
- Rebuilt the Supervisor Overview as a command centre with KPI cards, reporting activity chart, priority queue, facility coverage and inventory watch.
- Improved the worker report composer, extraction cards, confidence labels, spacing and responsive layout.
- Added shared synthetic report records in localStorage so confirmed worker reports can appear in the Supervisor Reports Inbox and worker report history.
- Added working report inbox status filters.
- Fixed a missing live status node (`#message-text`) that the existing report input workflow writes to. Its absence could throw a JavaScript error during typing and interrupt extraction.
- Added smoke checks for the live status node, profile menu and supervisor dashboard.

## Behaviour and limitations
- Extraction remains a deterministic, rule-based demo parser. It is not an AI service, diagnosis engine or connected government workflow.
- Shared worker/supervisor records are stored in the same browser's localStorage. They are not shared across devices or users.
- Client-side demo credentials are not production authentication.
- All displayed facility, worker, inventory and trend values are synthetic.
- Manual browser testing is still required for the actual target devices and browsers, including voice permissions and all six languages.

## Validation
- `npm run check` passes (6/6 extraction tests and all smoke checks).
- `node --check` passes for app and portal scripts.
- Worker and supervisor HTML parse successfully.
- `git diff --check` is clean.
