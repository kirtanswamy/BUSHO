# BUSHO: Submission Draft (Hack for Social Cause, VBYLD 2027)

> Draft text for the submission form. Items in **[brackets]** need your real information. Everything else matches what the prototype actually does; keep it that way.

## Name and tagline

**BUSHO: Bottom-Up Smart Health Orchestrator**

*Frontline health workers report in their own words. BUSHO turns it into a verified record and a safe, human-approved next step.*

## Summary (about 100 words)

Frontline health workers see what is happening in a community first: rising fevers, children with diarrhea, medicines running out. But that knowledge often travels slowly, through calls, paper registers and unstructured messages. BUSHO is a working prototype of a first-mile reporting flow. A worker writes a short update in their own language; BUSHO drafts a structured record; the worker verifies and corrects it; only then does a supervisor see a verified signal and prepare a draft medicine-replenishment request that a human approves. A person stays in control at every step.

## The problem

When field information is incomplete, inconsistent or slow to reach decision-makers, administrators have less timely visibility into stock-outs and service trends that deserve review. This is a workflow problem at the very first mile of the health system, where reports start as everyday language, not structured data.

## Our approach

| Step | What happens | Who is in control |
|------|--------------|-------------------|
| Report | Worker writes a field update in plain language | Health worker |
| Draft | BUSHO proposes structured fields next to the original text | Draft only, never a fact |
| Verify | Worker edits and confirms the record | Health worker |
| Act | Supervisor sees verified stock signals and prepares a replenishment **draft** | Supervisor, with approval |

## What makes it responsible

- **Three clearly separated states:** an unverified reported trend, a confirmed medical event (needs evidence and authorized review, outside BUSHO), and an administrative action (needs approval).
- **The original report stays visible** next to every extracted field.
- **No diagnosis, no automatic orders.** Replenishment is a draft only.
- **Voice input:** Browser-native Web Speech API; browser/vendor service may process audio remotely; BUSHO does not store audio recordings; manual text entry is always available as a fallback; availability depends on browser, microphone permission and network.
- **Honest labeling:** synthetic data, mock extraction and no live integrations are stated in the interface and docs.
- **Built for local languages:** English, Hindi, Tamil, Telugu, Bengali and Marathi **[confirm all six are live before submitting]**.

## Who it is for

Frontline health workers (for example CHOs, ANMs and ASHAs in India's primary care setting), facility or store staff, and block or district supervisors. The prototype has **not** yet been validated with these users.

## Social impact and SDGs

Intended alignment with **SDG 3 (Good Health and Well-Being)** and **SDG 10 (Reduced Inequalities)**, through better coordination of essential-medicine service delivery for communities that may face access barriers. This is an intended alignment, not measured progress. See `IMPACT_AND_IMPLEMENTATION.md` for risks, controls and proposed evaluation metrics.

## What is real and what is simulated

| Real in the prototype | Simulated or not built |
|-----------------------|------------------------|
| End-to-end worker to supervisor workflow | AI inference (extraction is rule-based) |
  | Human review and confirmation gates | Our own transcription service (voice input uses the browser's built-in recognition, not BUSHO's) |
  | Optional voice input through the browser's speech recognition, manual typing always available | Real orders or procurement |
| Editable drafts, saved in the browser | Shared backend, accounts, authentication |
| Inventory attention logic on sample stock | Live government or facility inventory feeds |
| Multilingual interface and sample reports | Real orders or procurement |
| Automated extraction tests and CI | Field validation or measured impact |

## Technology

Plain HTML, CSS and JavaScript (no framework, no build step, no dependencies), a small Node.js static server for local runs, Vercel for hosting, GitHub Actions for tests and checks. Chosen so it loads fast on low-end phones and any team can run it in one command.

## Challenges and what we learned

**[Write 2 or 3 honest sentences about what was hard and what you learned. For example: designing so that AI output can never look like a confirmed fact; keeping a six-language interface readable on a small phone; deciding what to leave out. Use only what is true for your team.]**

## What is next

1. Co-design and test the workflow with health workers and supervisors.
2. Replace mock extraction with a validated model, keeping mandatory human approval.
3. Add authentication, role-based access, a protected backend and audit logs.
4. Native-speaker review of every translation and real voice input.
5. Privacy and security review before any real data is handled.

## Links

- Live demo: https://project1busho.vercel.app
- Code: https://github.com/kirtanswamy/BUSHO
- Demo video: **[add link]**
- Slides (if any): **[add link]**

## Team

**[Names, roles and links]**

## AI tools disclosure

Complete `AI_USAGE_DISCLOSURE.md` with your team's real tools, tasks and honest estimate, and paste the final text into the submission form. Do not submit the worksheet with bracketed placeholders.
