# BUSHO — Synthetic Demo Scenarios

These scenarios are for a presentation or local smoke test. Use synthetic information only. Do not enter real patient-identifiable or sensitive health data.

## Scenario A — Routine report

**Goal:** demonstrate the normal reporting path.

1. Open the Worker view.
2. Select the built-in routine sample report.
3. Run the mock extraction action.
4. Compare the proposed fields with the original note.
5. Correct any field if the interface supports editing.
6. Confirm the record.
7. Open the Administrator view and explain how the confirmed demo record appears in the workflow.

**Narration point:** the extraction is simulated/rule-based in this prototype; a human must review and confirm the proposed record.

## Scenario B — Ambiguous report

**Goal:** show why human review matters.

1. Select the built-in ambiguous sample.
2. Run the mock extraction action.
3. Point out the uncertainty or fields that require correction.
4. Explain that an uncertain record should not be treated as a verified fact until reviewed.

**Narration point:** safe workflow design should make uncertainty visible rather than hiding it.

## Scenario C — Inventory attention signal

**Goal:** explain the proposed coordination loop.

1. Open the inventory view.
2. Point out that the inventory values are synthetic demonstration data.
3. Show the attention signal or relevant stock record if available in the current build.
4. Open the Administrator view and inspect the replenishment draft.
5. State clearly that the draft is simulated and does not submit a real order.

**Narration point:** a production version would need an approved, authoritative inventory source, timestamps, data-quality checks, and an authorized approval step.

## Recording checklist

- [ ] Reload the deployed website before recording.
- [ ] Confirm all buttons and navigation used in the recording work.
- [ ] Use only built-in or otherwise synthetic sample data.
- [ ] Keep the original report visible when explaining extracted fields.
- [ ] Explicitly identify mock extraction and synthetic stock.
- [ ] Do not claim live AI, government integration, or real ordering.
- [ ] Avoid showing personal accounts, private tabs, tokens, or unrelated notifications.
- [ ] Rewatch the exported video and confirm the narration matches the visible interface.

## Test result record

Record each scenario as **Pass**, **Fail**, or **Not tested** after running it. Do not mark a scenario as passed based only on this document.
