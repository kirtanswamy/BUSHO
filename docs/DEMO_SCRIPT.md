# BUSHO: Demo Script and Judge Q&A

Complements `DEMO_SCENARIOS.md` (step lists) with spoken lines, timing and honest answers to likely questions. Adjust tab names to match the live interface.

## 30-second pitch

"In rural health centres, the first signs of a problem, rising fevers or medicines running low, are known by the frontline worker long before they reach a decision-maker. BUSHO lets the worker report in their own language. It drafts a structured record, the worker verifies it, and only then does a supervisor see it and prepare a restock request that a human approves. AI proposes, people decide."

## 2-minute walkthrough

| Time | Show | Say |
|------|------|-----|
| 0:00 | Landing page | "This is the first mile of health reporting. A health worker at a village centre has a note to send." |
| 0:15 | Pick the **routine sample**, click **Extract** | "She writes in her own words: fever cases, diarrhea cases, ORS running low. BUSHO drafts a structured record. It is a draft, clearly marked provisional." |
| 0:35 | Point to the original text beside the fields | "The original note stays visible, so she can check every field against what she actually wrote." |
| 0:50 | Pick the **ambiguous sample** | "When the note is vague, 'a few fever cases', BUSHO flags the field for review instead of guessing." |
| 1:05 | Edit a field, **Confirm** | "Nothing is committed until she confirms. That is the key safety step." |
| 1:15 | Switch to the **supervisor view** | "Now the supervisor sees a verified signal, not a rumour: low ORS and iron stock, and a fever trend labelled as a trend only, not an outbreak." |
| 1:35 | Open the inventory item, create the draft | "BUSHO prepares a replenishment draft. It does not place an order. An authorized person approves." |
| 1:50 | Language selector (if live) | "The same flow works in six languages." |
| 1:55 | Safety cards | "Three states, kept separate: reported trend, confirmed medical event, administrative action." |

## Always say out loud

- Extraction is **rule-based and simulated** in this prototype.
- All data is **synthetic**.
- Voice input uses the browser's native Web Speech API; the browser or its vendor may process audio remotely; BUSHO does not store audio recordings; manual text entry remains the fallback; availability depends on browser support, microphone permission and network.
- No live integrations, no real orders, not field-validated.

## Likely questions

**Is the AI real?** Not yet. The extraction is rule-based so the workflow and safeguards can be shown honestly. The design assumes a validated model would later replace it, with human confirmation kept mandatory.

**What if the extraction is wrong?** The worker sees the original text next to each field, can edit anything, and nothing is saved as verified until they confirm. Uncertain fields are flagged for review.

**Does it diagnose or declare outbreaks?** No. A fever mention is shown as a reported trend for human review. A confirmed medical event requires evidence and an authorized process outside BUSHO.

**What about patient privacy?** The demo uses synthetic data only, stores state in the browser, and warns users not to enter names or phone numbers. A real pilot would need authentication, a protected backend, data minimization and a privacy review.

**Who is it for?** Frontline health workers and their supervisors. We have not yet tested with them, and the first next step is co-design.

**How accurate are the translations?** They were AI-drafted and need native-speaker review before any pilot. We would rather say that than overclaim.

**What would it take to deploy?** Authentication, a backend, audit logging, a validated extraction model, formal inventory integration and a pilot with the responsible health authority. See `IMPACT_AND_IMPLEMENTATION.md`.

**Why no framework?** To stay fast on low-end phones and easy to run and audit.

## Before presenting

- [ ] Reload the live site and click **Reset demo data**
- [ ] Run the whole flow once in the language you will present
- [ ] Close private tabs, notifications and anything showing personal accounts
- [ ] Have a screenshot or recording ready in case the network fails
