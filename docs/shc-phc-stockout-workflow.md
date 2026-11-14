# SHC-to-PHC stockout exception workflow — Milestone 1

Status: additive database foundation drafted on feat/shc-phc-stockout-foundation.

## Product boundary
BUSHO records an SHC stockout observation, routes it to its verified parent PHC, records PHC review and physical last-mile handover/receipt. Official registers and DVDMS/DPDMIS remain authoritative. BUSHO does not calculate authoritative stock balance, place a purchase order, approve clinical treatment or claim a government transaction occurred merely because a reference was typed.

## New structures
- facility_service_links: source-attributed SHC-to-PHC mapping. Only current verified links can be used. Authenticated browser clients cannot create or approve links.
- stockout_cases: one case per SHC stockout exception. Original observation, PHC availability, official references, PHC handover and SHC receipt remain separate facts.
- stockout_case_events: trigger-created append-only history of status transitions, actor, role, note, external reference and quantity.

## Role boundary
- worker: assigned SHC worker creates/submits the exception and records collection/receipt.
- supervisor: assigned PHC reviewer acknowledges, reviews, requests clarification, accepts for PHC action or records PHC inability to fulfil.
- storekeeper: assigned PHC storekeeper records official external indent reference, upstream receipt at PHC and PHC-to-SHC handover.
- No routine BMO/CMHO approval step is introduced. Cadre/designation remains separate from application role.

## Deliberate limitations
1. Facility taxonomy labels do not prove a facility is currently operational. Links require a reviewed source.
2. Medicine is a source-attributed text label/reference in this milestone. Unreviewed EDL rows are not normalized/selectable SKUs.
3. PHC availability is an observation, not a balance calculation.
4. No full stock ledger or batch accounting is added.
5. Local SOP confirmation remains necessary for reviewer delegation and handover sign-off.
6. No facility, user, link, stock count or case is seeded.
7. The migration requires PostgreSQL 17 migration and RLS contract verification before it can be considered validated.

## Safety gate
Proposal only. Do not apply to live Supabase, create live facility links, deploy, merge PR #5 or claim a working live workflow without separate review and explicit approval.

## Worker experience — Milestone 2 draft

The worker portal now has a Medicine Stockout workspace with:
- Authenticated worker-only loading after the existing `busho:authenticated` event.
- Assigned SHC and current verified parent-PHC context; it refuses to infer a parent PHC.
- A stockout form that captures medicine label, optional source reference, observed quantity, requested quantity, unit, observation source and an operational note.
- A case list with status and event history.
- Worker actions limited to clarification resubmission, confirmation of SHC collection and cumulative partial/final physical receipt.
- Client-side escaping for displayed data; server-side role checks, RLS and transition triggers remain authoritative.

The worker screen intentionally uses a free-text medicine label rather than implying that unreviewed EDL transcription rows are approved catalogue choices. The form asks for operational evidence only and warns against entering patient identifiers.

## Validation status of worker experience

- Added client tests for verified parent-PHC routing, refusal when no verified link exists, role-limited worker transitions and portal wiring.
- These new Node tests are included by the repository's existing `node --test` script.
- The database-contract CI run that passed covered the Milestone 1 migration and PostgreSQL RLS contract. It predates the worker UI/client additions.
- A fresh CI run and browser-level interaction test are still required for this UI/client change. The Vercel preview check is separate and is not a production deployment.
