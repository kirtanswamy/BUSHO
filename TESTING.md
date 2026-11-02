# BUSHO — Manual Demo Smoke Tests

These are manual checks for the browser prototype. They are not automated test-suite results. Use synthetic/sample data only. Do not enter real patient-identifiable or sensitive health information.

## Environment

- Node.js 18 or newer
- Modern browser
- Start with `npm start` (or `node server.mjs`) and open `http://127.0.0.1:4173`

## Checks

1. **App loads:** The page loads without a blank screen; Worker and Administrator views are visible/selectable.
2. **Sample report:** Select the routine sample and confirm the raw report is displayed.
3. **Mock extraction:** Trigger extraction and verify the interface shows proposed structured fields. Treat them as draft values, not AI-verified clinical facts.
4. **Human confirmation:** Review and confirm the record; verify the UI changes to a confirmed/verified state.
5. **Edit flow:** Re-open or edit the fields, change a value, and confirm the interface allows correction before confirmation.
6. **Ambiguous report:** Select the ambiguous sample and check that the UI signals the need for review rather than presenting uncertain information as definitive.
7. **Inventory attention:** Open the inventory view and confirm the displayed stock values are clearly demo/synthetic data.
8. **Admin workflow:** Switch to the Administrator view and inspect the replenishment draft. Confirm the UI does not imply that an actual purchase order was sent.
9. **Persistence:** Change the workflow state, refresh the page, and check whether the demo state persists in the same browser via `localStorage`.
10. **Reset:** Click Reset demo data and verify the interface returns to the initial sample state.
11. **Voice disclosure:** Confirm the interface explains that browser speech recognition may send audio to the browser vendor, BUSHO does not store audio, and manual text entry is available.
12. **Voice availability:** If the browser supports Web Speech API and permission/network allow it, test a short non-sensitive phrase. If recognition is unavailable or errors, verify manual entry still works. Do not claim cross-browser reliability based on one test.
13. **Translations:** Switch through each supported language and check labels, buttons, errors, and privacy notices for clipping or untranslated strings.
14. **Responsive layout:** Check a narrow viewport (360px) and desktop layout; ensure controls remain reachable and text is readable.
15. **No production claims:** Check that demo screenshots and presentation materials identify synthetic data, mock extraction, and missing live integrations.

## Record results

For each check, record Pass / Fail / Not tested, browser and date, and any observed issue. Do not report these checks as passed until someone has actually run them. Automated checks are run separately with `npm run check`.
