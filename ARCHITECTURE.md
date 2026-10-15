# BUSHO — Architecture Overview

## Purpose

BUSHO (Bottom-Up Smart Health Orchestrator) is a browser-based demonstration of a first-mile health reporting and medicine-stock coordination workflow. It illustrates how frontline notes could be converted into structured records for human review and how inventory attention signals could inform administrator-reviewed replenishment drafts.

This document describes the current prototype, not a production healthcare system.

## Components

- `index.html`: application shell and Worker/Administrator console views.
- `styles-v2.css`: responsive visual system and layout.
- `app-v2.js`: client-side demo state, mock extraction, validation, sample inventory logic, workflow transitions, and browser-local persistence.
- `server.mjs`: small Node.js HTTP server that serves the static application files.
- `terms.html` and `privacy.html`: pre-pilot draft documents; they do not establish that the prototype has undergone legal or privacy review.

## Current data flow

1. A user opens the demo and enters or selects a sample frontline report.
2. Client-side mock extraction proposes structured fields from the report.
3. The worker reviews and confirms or corrects the proposed information.
4. The interface compares the demo record against synthetic inventory values and shows attention signals.
5. An administrator can review a replenishment draft in the simulated workflow.
6. Demo state is saved in the browser's `localStorage`; the reset control restores the demonstration state.

## Trust and data boundaries

- Raw report text remains visible alongside the proposed structured record to support human review.
- Extracted values are drafts, not verified clinical facts, until a human confirms them.
- Inventory figures and example reports are synthetic demonstration data.
- Replenishment items are drafts only; the prototype does not place orders or communicate with a government procurement or inventory system.
- The application does not implement production authentication, a shared database, role-based access control, server-side persistence, or live AI inference.
- Do not enter real patient-identifiable or sensitive health information into this demo.

## Runtime

Prerequisite: Node.js 18 or newer and a modern browser.

Run locally:

```sh
node server.mjs
```

Open the local URL printed by the server (the current server listens on `127.0.0.1:4173`).

## Proposed production evolution

A pilot would require workflow validation with health workers and administrators; secure authentication and authorization; a protected backend and database; audit logging; privacy and security review; validated extraction with human approval; integration agreements and APIs for inventory systems; and monitoring for data quality and operational safety.

## Evaluation plan

A future pilot could measure report completion time, completeness of required fields, human correction rate, time from stock concern to administrator review, and administrator-rated usefulness. These are proposed evaluation metrics, not results measured by the current demo.
