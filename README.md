<!--
  BUSHO repository landing page
  Keep claims aligned with the working prototype. Update this file when the demo changes.
-->

<div align="center">

<img src="assets/busho-github-hero.svg" alt="BUSHO — Make the first mile of health information work better" width="100%" />

<br />

[![Live Demo](https://img.shields.io/badge/OPEN_LIVE_DEMO-0B7A70?style=for-the-badge&logo=vercel&logoColor=white)](https://busho.de5.net)
[![Source Code](https://img.shields.io/badge/SOURCE_CODE-172B3A?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kirtanswamy/BUSHO)
[![MIT License](https://img.shields.io/badge/LICENSE-MIT-4C9A82?style=for-the-badge)](LICENSE)

**Frontline workers see the first signal. The system should help that signal reach the right people—clearly, safely, and with a human in control.**

[Problem](#-the-gap-busho-is-designed-to-address) · [How it works](#-how-busho-works) · [Evidence](#-why-this-workflow-matters) · [Build](#-run-the-prototype) · [Roadmap](#-what-must-happen-before-a-real-pilot)

</div>

---

## The idea in one sentence

**BUSHO (Bottom-Up Smart Health Orchestrator)** is a prototype for turning frontline health-worker notes into structured, human-verified operational information—and helping supervisors review medicine-stock signals without automating clinical decisions or procurement.

It focuses on a specific hand-off: **community → frontline worker → facility / supervisor**.

## 🧭 The gap BUSHO is designed to address

A health worker may notice a local pattern, a follow-up need, or a medicine running low. But a useful signal can lose time and context as it moves from a field note into registers, calls, spreadsheets, and administrative workflows.

This is not a claim that India has no digital health or supply-chain systems. Public programmes and state systems already exist. The design question BUSHO explores is narrower:

> **Can the first-mile report become easier to structure, verify, and route—while fitting around existing facility and government systems rather than replacing them?**

<div align="center">

| What can go wrong at the first mile | What BUSHO prototypes |
|:--|:--|
| Notes arrive in inconsistent, free-text formats | A structured draft beside the original report |
| Important details can be missed or misread | Human correction and confirmation before a record is treated as verified |
| Stock concerns may need escalation | A supervisor-facing attention signal using sample inventory |
| A proposed next step can be mistaken for an order | An explicitly reviewable draft; no automatic procurement |

</div>

## ✳️ How BUSHO works

<img src="assets/busho-workflow.svg" alt="BUSHO workflow: field report, mock extraction, human review, synthetic stock signal and administrator-reviewed draft" width="100%" />

1. **Report** — a frontline worker enters a short field update in plain language.
2. **Structure** — the prototype proposes fields using mock, rule-based extraction.
3. **Verify** — the worker can inspect, edit, and confirm the proposed record. The original report remains visible.
4. **Review** — a supervisor sees the verified operational record alongside a synthetic stock attention signal.
5. **Prepare** — the supervisor can review a replenishment draft. **No real order is placed.**

### The non-negotiable guardrails

- A draft is not a fact. A reported trend is not a diagnosis.
- Human confirmation is required before a record is treated as verified.
- Stock signals are operational prompts, not clinical recommendations.
- Replenishment is a draft for review—not an automatic order.
- The demo uses synthetic sample data and browser-local storage. Do not enter real patient-identifiable or sensitive health information.

## 📚 Why this workflow matters

The following sources establish that medicine availability and frontline information workflows are real areas of concern. They do **not** prove that BUSHO has solved them.

<details>
<summary><strong>Chhattisgarh: a historical public-facility availability finding</strong></summary>

A study covering **100 public health facilities across 15 districts** and **1,290 prescriptions** in Chhattisgarh reported that **58.28% of prescribed generic medicines included in the state's essential-drug list were available** to patients during the study period (2013–14).

This is a historical, study-specific finding—not a current statewide estimate. It is useful context for why medicine availability deserves attention, not evidence of BUSHO's impact.

- [Study record — PubMed](https://pubmed.ncbi.nlm.nih.gov/29915750/)
- [State Health Resource Centre, Chhattisgarh — free-drug and diagnostics studies](https://www.shsrc.org/StudiesFreeDrugandDiagnostics.html)

</details>

<details>
<summary><strong>India: medicine availability varies across settings</strong></summary>

A 2024 review of 11 studies reported public-sector medicine availability estimates ranging from **17% to 51%** across the included studies. The range reflects different settings and methods; it should not be read as one national estimate.

- [2024 review — full text on PubMed Central](https://pmc.ncbi.nlm.nih.gov/articles/PMC11174260/)

</details>

<details>
<summary><strong>Frontline digital workflows: usability and data burden matter</strong></summary>

A 2022 qualitative study in *BMJ Open* described frontline workers' experiences with digitised health reporting, including burdens created by multiple forms and registers, data-entry backlogs, and data-quality challenges.

The lesson for BUSHO is not “add another app.” It is to test whether a workflow reduces friction and duplicate effort in the actual local context.

- [BMJ Open study — PubMed](https://pubmed.ncbi.nlm.nih.gov/35140145/)

</details>

<details>
<summary><strong>Existing systems matter: BUSHO is not a replacement</strong></summary>

India and Chhattisgarh have existing health-information and medicine-supply initiatives. The 16th Common Review Mission report discusses state-level systems and implementation issues. Any future BUSHO pilot must map the real workflow and approved interfaces first.

- [16th Common Review Mission report (2024) — NHSRC](https://nhsrcindia.org/sites/default/files/2025-03/16th%20CRM%20Report%20%282024%29_0.pdf)
- [Free Drugs Service Initiative — NHSRC](https://nhsrcindia.org/free-drugs-service-initiative-0)

</details>

## 🧪 What exists today

<div align="center">

| In this prototype | Not implemented / not validated |
|:--|:--|
| Worker and supervisor demo views | Production authentication or role-based access |
| Mock, rule-based extraction | Production AI inference |
| Editable records and human confirmation | Clinical diagnosis or triage |
| Browser-native voice input, where supported | A BUSHO-operated transcription service |
| Synthetic inventory attention logic | Live government / facility inventory feeds |
| Replenishment draft workflow | Real orders, procurement, or payments |
| Multilingual interface: English, Hindi, Tamil, Telugu, Bengali, Marathi | Field validation with health workers |
| Browser-local persistence | Shared backend, database, or cross-device sync |
| Automated checks for prototype behaviour | Measured health outcomes or proven impact |

</div>

**Voice privacy:** Voice input uses the browser's speech-recognition service, which may send audio to the browser vendor. BUSHO does not store audio recordings. Manual text entry remains available. Do not speak names, phone numbers, diagnoses, government IDs, or other identifying patient details.

## 🧱 Build and run locally

**Requirements:** Node.js 18+ and a modern browser.

```bash
git clone https://github.com/kirtanswamy/BUSHO.git
cd BUSHO
npm install
npm start
```

Open **http://127.0.0.1:4173**.

Run the automated checks:

```bash
npm run check
```

### Project map

| Path | Responsibility |
|:--|:--|
| `index.html` | Application shell and worker / supervisor views |
| `styles-v2.css` | Responsive interface and design system |
| `app-v2.js` | Demo workflow, mock extraction, validation, sample inventory and voice interaction |
| `i18n.js` | Interface translations |
| `server.mjs` | Lightweight local static server |
| `tests/` and `scripts/` | Automated checks and smoke tests |
| `ARCHITECTURE.md` | Data flow, boundaries and proposed evolution |
| `docs/IMPACT_AND_IMPLEMENTATION.md` | Risks, pilot logic and evaluation approach |

## 🚧 What must happen before a real pilot

BUSHO is a **workflow prototype**, not a deployable healthcare product. A responsible next phase would be:

1. **Validate the problem locally** — interview frontline workers, facility staff and supervisors; map the actual paper, phone, HMIS and stock workflows.
2. **Check for duplication** — identify what existing systems already capture and where an approved hand-off is genuinely missing.
3. **Co-design and test** — use synthetic or properly de-identified scenarios first; test on low-end devices and unreliable connectivity.
4. **Build the foundations** — secure authentication, role-based permissions, protected backend, audit logs, retention controls and security review.
5. **Validate the technology** — evaluate extraction against a labelled dataset, native-speaker review translations, and keep human approval.
6. **Run a supervised pilot** — measure reporting time, completeness, correction rate, duplicate-entry burden, escalation time, stockout duration and worker adoption against a baseline.

Potential pilot targets are hypotheses to test—not achieved results. No reduction in mortality, disease burden, or stock-outs is claimed.

## 🎯 What success should mean

A useful BUSHO pilot should demonstrate that it helps workers and supervisors do a real task **more accurately or with less friction**, without creating extra reporting burden or unsafe automation.

The first proof should be operational:

- Is the report more complete?
- Does verification take less time?
- Are errors caught before escalation?
- Does the right person receive a useful stock signal sooner?
- Does the workflow avoid duplicate entry?
- Do workers choose to keep using it?

If those answers are not supported by field evidence, the project should change—not inflate its impact claims.

---

<div align="center">

**Built as a social-impact prototype. Designed around human review. Open to evidence and iteration.**

[Live prototype](https://busho.de5.net) · [Demo deployment](https://project1busho.vercel.app/) · [Architecture](ARCHITECTURE.md) · [Impact & implementation plan](docs/IMPACT_AND_IMPLEMENTATION.md)

<sub>BUSHO • Bottom-Up Smart Health Orchestrator</sub>

</div>
