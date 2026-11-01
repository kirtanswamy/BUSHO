# Launch Checklist

## Code (before 11 pm)

- [ ] `npm run check` passes locally
- [ ] Stale text gone (the smoke test fails if "Code for Communities" is still present)
- [ ] Walk the full demo in all six languages at 360px, 768px and 1280px
- [ ] Keyboard-only walkthrough works, focus is always visible
- [ ] Browser console shows no errors
- [ ] Vercel production deploy shows the latest commit (open the live URL in a private window)

## GitHub settings (cannot be done from files)

- [ ] **Description:** "Turn frontline health field notes into verified, human-approved action. Multilingual prototype, synthetic data only."
- [ ] **Website:** https://project1busho.vercel.app
- [ ] **Topics:** `hackathon` `public-health` `social-good` `healthtech` `human-in-the-loop` `accessibility` `multilingual` `india` `vanilla-js`
- [ ] **Social preview image** (Settings > General, 1280x640): screenshot of the hero
- [ ] Enable **private vulnerability reporting** (Settings > Code security)
- [ ] Pin the repository on your profile
- [ ] Create a release `v0.2.0` with short notes
- [ ] Confirm the **CI** badge/status is green on `main`

## Security headers

`vercel.json` ships the Content Security Policy as **Report-Only** so it cannot break the demo. After the final deploy, open the live site with the browser console open. If there are no CSP warnings, rename `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `vercel.json` and redeploy.

## Submission

- [ ] `AI_USAGE_DISCLOSURE.md` completed with real tools, tasks and a team-agreed estimate
- [ ] `docs/SUBMISSION.md` bracketed items filled
- [ ] Demo video recorded with the checklist in `DEMO_SCENARIOS.md`
- [ ] Links tested in a private window: live demo, repo, video
- [ ] Translations flagged as AI-drafted unless a native speaker has reviewed them
