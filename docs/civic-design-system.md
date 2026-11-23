# BUSHO Civic Design System

**Reference:** Workflow Freeze v1.0  
**Scope:** Public landing page, sign-in, SHC Worker, PHC Reviewer and PHC Stock Custodian workspaces.

This is a project-specific civic interface system informed by public-service accessibility and design conventions. It is not a claim of UX4G, GIGW or government certification, nor does it imply government ownership or endorsement.

## Foundations

- Light-first field canvas: `--civic-canvas`, `--civic-surface`, `--civic-well`.
- Institutional navy, utility navy, teal and restrained amber are defined in `civic-design-system.css`.
- Semantic status colours and neutral/contrast tokens are centralised in the same `:root` token block.
- Landing-page components consume the shared tokens; the CSS lint script rejects hard-coded hex colours outside the token block in the new civic styles.
- Noto Sans and Noto Sans Devanagari are the primary Latin/Indic font families.
- The root font size is 16px with persisted A− (90%), A (100%) and A+ (115%) preferences.
- Spacing follows an 8px rhythm; cards and controls use restrained 6–8px radii and subtle elevation.

## Shared shell

`civic-shell.js` adds the utility strip, skip link, language preference, text-size controls, high-contrast toggle, offline notice, print heading and policy footer. It reuses the existing role navigation toggle instead of creating a second menu control.

Worker, Supervisor and Storekeeper share the same layout treatment while retaining separate role navigation and authenticated controllers. Presentation code does not grant permissions, call privileged endpoints or modify workflow transitions.

## Status presentation

Operational states are rendered as readable labels with an icon, tinted surface and semantic state token. Unknown states are not guessed: they remain in a neutral fallback presentation.

Counts use singular/plural wording. Audit timelines show state transitions where the event stream provides both prior and resulting state, alongside actor and timestamp.

## Workflow Freeze v1.0

- SHC worker records a physical observation and submits it to the verified parent PHC.
- PHC reviewer accepts for PHC action, requests clarification or marks unable to fulfil.
- Branch 1: PHC stock available → PHC-to-SHC handover → SHC physical receipt/discrepancy → closure.
- Branch 2: PHC stock unavailable → authorised official portal indent and manually recorded external reference → upstream receipt at PHC → PHC-to-SHC handover → SHC physical receipt/discrepancy → closure.

BUSHO does not claim an authoritative stock balance, submit DPDMIS requests, replace official registers or procurement systems, create clinical decisions, or route direct CGMSC warehouse-to-SHC deliveries. Stockout flows must not contain patient-identifiable information.

## Responsive and accessibility behaviour

- Desktop: sticky full-height navigation rail.
- At 960px and below: slide-over navigation drawer.
- At 767px and below: stacked content and card-like data rows.
- Print: A4 page sizing, print context and removal of navigation chrome.
- Offline: an informational notice directs staff to official paper registers and manual handoff, then reconciliation when connected.
- High contrast: black/white surfaces, 2px borders and a yellow focus indicator.
- Keyboard focus styling and skip navigation are present.

Automated browser smoke checks cover 1440px, 768px and 375px widths, drawer toggling, horizontal overflow, A+ text scaling, high-contrast persistence and the synthetic case preview. These automated checks do not establish WCAG 2.2 AA conformance. Screen-reader testing, full manual keyboard review, zoom/reflow review and native-speaker review remain release checks.
