# BUSHO: Submission Draft (Hack for Social Cause, VBYLD 2027)

> Draft text for the submission form. Items in **[brackets]** need your real information. Keep all claims aligned with the working prototype.

## Name and tagline

**BUSHO: Bottom-Up Smart Health Orchestrator**

*Frontline health workers report in their own words. BUSHO drafts a structured record for human verification and a supervisor-reviewed operational next step.*

## Summary (about 100 words)

Frontline health workers often notice community health-service signals first: recurring symptoms, follow-up needs, or medicines running low. But information can lose consistency and context as it moves from field notes into registers, calls and administrative workflows. BUSHO is a browser-based prototype exploring a first-mile reporting flow. A worker enters a short update; BUSHO proposes structured fields using mock, rule-based extraction; the worker reviews and confirms the record; a supervisor can then inspect a synthetic stock signal and prepare a replenishment draft for human approval. BUSHO does not diagnose, place orders, or replace existing health information systems.

## The problem

When field information is incomplete, inconsistent or slow to reach decision-makers, administrators may have less timely visibility into issues that deserve review. This is a workflow problem at the first mile, where reports often begin as everyday language rather than structured data.

## Our approach

| Step | What happens | Who is in control |
|---|---|---|
| Report | Worker enters a field update in plain language | Health worker |
| Draft | BUSHO proposes structured fields next to the original text | Provisional draft only |
| Verify | Worker edits and confirms the record | Health worker |
| Review | Supervisor inspects verified operational information and synthetic stock signals | Supervisor |
| Prepare | Supervisor prepares a replenishment draft | Authorized human approval; no real order |

## What makes it responsible

- **The original report stays visible** next to proposed structured fields.
- **No diagnosis, no automatic orders.** Replenishment remains a draft.
- **Voice input:** Browser-native Web Speech API; the browser/vendor service may process audio remotely; BUSHO does not store audio recordings; manual text entry remains available; availability depends on browser, permission and network.
- **Honest labeling:** synthetic data, mock extraction and absent live integrations are stated in the interface and documentation.
- **Local-language interface:** English, Hindi, Tamil, Telugu, Bengali and Marathi. Translation quality still needs native-speaker review before a real pilot.

## Who it is for

Potential users include frontline health workers (for example CHOs, ANMs and ASHAs in India's primary-care setting), facility or store staff, and block or district supervisors. The prototype has **not** yet been validated with these users.

## Social impact and SDGs

Intended alignment with **SDG 3 (Good Health and Well-Being)** and **SDG 10 (Reduced Inequalities)** through better coordination of essential-medicine service delivery. This is an intended alignment, not measured progress. See [IMPACT_AND_IMPLEMENTATION.md](../IMPACT_AND_IMPLEMENTATION.md) for risks, safeguards and proposed evaluation metrics.

## What is real and what is simulated

| Real in the prototype | Simulated or not built |
|---|---|
| Worker-to-supervisor demonstration workflow | Production AI inference (extraction is mock/rule-based) |
| Human review and confirmation gates | Clinical diagnosis or triage |
| Optional browser-native speech recognition, where supported | BUSHO-operated transcription service |
| Editable drafts saved in the browser | Shared backend, accounts or production authentication |
| Inventory attention logic on sample stock | Live government or facility inventory feeds |
| Multilingual interface and sample reports | Real orders or procurement |
| Automated extraction tests and CI workflow | Field validation or measured impact |

## Technology

Plain HTML, CSS and JavaScript (no framework or runtime dependencies), a small Node.js static server for local runs, Vercel for hosting, and GitHub Actions for automated checks.

## Challenges and what we learned

**[Write 2–3 sentences about what was genuinely difficult and what the team learned. Do not use generic claims.]**

## What is next

1. Co-design and test the workflow with frontline workers and supervisors.
2. Check for duplication with existing HMIS and state inventory workflows.
3. Build secure authentication, role-based access, a protected backend and audit logs.
4. Validate extraction against labelled examples and keep mandatory human approval.
5. Obtain native-speaker translation review and complete privacy/security review before any real data is handled.
6. Run a supervised pilot with baseline measures and predefined stop conditions.

## Links

- **Live demo:** https://busho.de5.net
- Alternate deployment: https://project1busho.vercel.app/
- Code: https://github.com/kirtanswamy/BUSHO
- Demo video: **[add link]**
- Slides (if any): **[add link]**

## Team

**[Names, roles and links]**

## AI tools disclosure

Complete `AI_USAGE_DISCLOSURE.md` with the team's actual tools, tasks and honest estimate, then paste the final disclosure into the submission form. Do not submit the worksheet with bracketed placeholders.
