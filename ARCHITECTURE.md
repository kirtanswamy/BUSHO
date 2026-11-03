# BUSHO — Architecture Overview

## Product structure

BUSHO is one public-facing platform with two separate role-specific web portals:

- `index.html` — common public landing page.
- `signin.html` — role selection.
- `worker.html` — Health Worker login and field-reporting workspace.
- `supervisor.html` — Supervisor login and operations workspace.

The worker and supervisor portals have independent page shells and navigation. The worker uses a compact sidebar on desktop and bottom navigation on mobile. The supervisor uses a persistent navy sidebar with a light enterprise workspace.

## Current prototype implementation

- `app-v2.js` — existing client-side extraction, validation, confirmation, sample inventory and demonstration workflow.
- `role-auth.js` — client-side synthetic demo credential gate. It is not production authentication.
- `portal-navigation.js` — role-specific module navigation for the two portal shells.
- `styles-v2.css` — shared visual tokens, public landing styles, worker layout and supervisor layout.
- `i18n.js` — existing six-language translation support.
- `server.mjs` — static Node.js development server.

## Role responsibilities

### Health Worker

The worker portal is limited in its interface to:
- overview and assigned facility context;
- creating a field report through text or voice;
- reviewing provisional extracted fields;
- explicitly confirming a report;
- viewing their report history and pending confirmation state.

The worker interface does not expose supervisor dashboard modules or administrative approval controls.

### Supervisor

The supervisor portal provides:
- operations overview;
- reports inbox concept;
- health-trend signals;
- inventory monitoring;
- facility and worker overview;
- administrative approvals concept;
- activity log.

The supervisor view must distinguish report review from administrative approval. A worker-confirmed report is not a diagnosis, and a stock signal does not itself authorize procurement.

## Data and security boundaries

This is still a browser-based synthetic-data prototype:
- Demo credentials are checked in client-side JavaScript.
- Demo session state is stored in browser `sessionStorage`.
- Workflow data is stored in browser `localStorage`.
- The worker and supervisor pages are not protected by production server-side role-based access control.
- The supervisor modules include illustrative synthetic records and are not a shared live reporting database.
- The prototype does not connect to government health systems or inventory services.
- Do not enter real patient-identifiable or sensitive health information.

Production readiness requires a secure identity provider, server-side authorization on every protected endpoint, a shared backend/database, facility-scoped access rules, audit logging, privacy/security review, and validated integration agreements.

## Run locally

Prerequisite: Node.js 18 or newer.

```sh
npm run check
npm run start
```

Open the local URL printed by the server. Select **Sign in** on the public landing page, then choose the appropriate role.

Synthetic demo credentials:
- Health Worker: `worker@busho.demo` / `worker123`
- Supervisor: `supervisor@busho.demo` / `supervisor123`

These credentials are for local demonstration only and must not be used in production.

## Quality assurance

Automated checks cover extraction behavior, basic route availability, HTML integrity, localization parity, and server hardening. They do not replace manual browser testing of role navigation, visual layout, mobile behavior, voice recognition, and end-to-end workflows.
