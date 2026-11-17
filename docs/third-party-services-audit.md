# BUSHO third-party services and SDK audit

**Reviewed:** 17 November 2026  
**Scope:** source tree on `governance/privacy-accessibility-foundation`, Vercel project configuration, and the Supabase project configured by `supabase-config.js`. This is a source/configuration review, not a packet capture or independent vendor audit.

## Findings

| Service / dependency | Why it is present | Data or metadata that may be processed | Action / status |
|---|---|---|---|
| Vercel | Static website hosting and deployment | Request metadata, IP address, user agent, access/security logs and platform diagnostics may be processed under Vercel's service configuration | Required hosting provider; verify project log retention, region, subprocessors and data-processing terms before any real-data pilot |
| Supabase Auth, Data API and Edge Functions | Authentication, profile/facility-scoped data and server-side workflows | Account email, profile/role/scope, workflow text and structured records, audit metadata, request metadata | Required backend; browser client uses direct HTTPS requests and a public publishable key. No service-role key is present in browser config. Verify exact project, region, backup/retention, access logs, RLS and provider terms |
| Google Fonts | Remote typography and language font delivery | Browser request metadata, including IP address and user-agent; font requests can disclose a visit to Google infrastructure | Third-party resource, not a BUSHO SDK. Could be self-hosted to reduce external requests, but multilingual font licensing/coverage and build size must be checked first |
| Browser-native SpeechRecognition / webkitSpeechRecognition | Optional voice-to-text in the worker portal | Microphone audio and speech-recognition request data may be processed by the browser vendor or its speech service | Not a BUSHO-operated transcription backend. Voice is optional; text entry remains available. Do not speak patient identifiers or sensitive details |
| npm development dependencies | Local tests and development | Package installation metadata is sent to npm registry when developers install dependencies | `@playwright/test` and Supabase CLI are development dependencies only; no production runtime package dependency is declared in package.json |

## SDK and tracker scan

- No `@supabase/supabase-js` browser package is declared; the app uses a small first-party client wrapper around Supabase HTTPS endpoints.
- No Google Analytics / gtag, Google Tag Manager, Meta Pixel, Microsoft Clarity, Hotjar, Mixpanel, Segment or PostHog integration was identified in the reviewed source tree.
- No advertising or session-replay SDK was identified in the reviewed source tree.
- This does not rule out Vercel platform-level telemetry, browser-vendor speech processing, provider logs, DNS/CDN logs or scripts introduced after this review.

## Configuration observations

- `supabase-config.js` and the Vercel Content Security Policy connect-src currently identify project ref `qalfoqhtyrtenkuitvvt` (BUSHO-Demo, ap-south-1).
- A separate Supabase project named BUSHO exists at ref `vufnjwkaaqtyukjcvknu` (eu-central-1). Its schema and migration history differ substantially. Do not switch the application to it or deploy migrations/functions there without an explicit environment decision.
- The current Vercel Content-Security-Policy is `Report-Only`, not an enforcing CSP. It is a useful observation stage but must not be described as CSP protection being fully enforced.
- Google Fonts and the Supabase API host are explicitly allowed by the current policy. Voice recognition is browser-mediated and may have browser-specific network destinations not represented by the application CSP.

## Required follow-up before real personal or health data

1. Confirm the legal entity/controller and the exact Supabase/Vercel environment for the pilot.
2. Review provider DPAs, subprocessors, hosting/backup regions, cross-border transfers and retention.
3. Decide whether Google Fonts should be self-hosted after checking font licences and multilingual rendering.
4. Keep voice recognition opt-in, disclose the browser provider behaviour at the point of use, and preserve text entry.
5. Review Vercel and Supabase logs/retention and document incident response.
6. Re-run this audit on every release that changes scripts, dependencies, hosting or integrations.

## Conclusion

No third-party analytics, advertising or session-replay SDK was identified in the reviewed repository source. The material external dependencies are Vercel, Supabase, Google Fonts and optional browser speech recognition. This is not a certification that no third-party processing occurs.