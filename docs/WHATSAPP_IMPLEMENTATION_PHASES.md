# BUSHO WhatsApp Implementation Phases

## Decisions

- Backend hosting: Railway
- Database: Supabase PostgreSQL
- WhatsApp: Meta WhatsApp Cloud API (not yet configured)
- AI providers: Gemini and OpenAI (API keys not yet created)
- Interaction: WhatsApp text and voice notes
- Initial language test set: English, Hindi, Tamil, Bengali
- Longer-term target: phased support for Indian languages

## Phase 1 — Backend foundation

- [x] Create isolated Node.js API package
- [x] Add health and readiness endpoints
- [x] Add PostgreSQL pool configuration
- [x] Add initial schema migration
- [x] Add environment template
- [x] Add API smoke tests
- [x] Add Railway and Supabase setup guide

## Phase 2 — WhatsApp text integration

- Create Meta developer app and WhatsApp Cloud API test setup.
- Configure a public HTTPS webhook.
- Verify Meta webhook challenge and request signature.
- Persist inbound messages with provider message ID uniqueness.
- Add a queue and idempotent message processor.
- Send a basic acknowledgement through the Cloud API.

## Phase 3 — AI extraction and confirmation

- Implement a provider-neutral extraction interface.
- Add Gemini and OpenAI adapters.
- Validate model output against a strict JSON schema.
- Add primary/fallback policy and provider telemetry.
- Build clarification and explicit worker-confirmation states.
- Persist only confirmed operational reports as verified.

## Phase 4 — Voice notes and multilingual support

- Retrieve WhatsApp media by media ID.
- Download voice-note media securely and temporarily.
- Transcribe/understand audio using configured provider adapters.
- Preserve original language and transcript.
- Validate English, Hindi, Tamil, and Bengali with native-speaker-reviewed synthetic test cases.
- Expand to additional languages only after evaluation.

## Phase 5 — Dashboard integration

- Add authenticated report and inventory endpoints.
- Replace browser-local demo data with API-backed data behind a feature flag.
- Add facility-level authorization and administrator review.
- Keep replenishment actions as drafts until an authorized administrator approves them.

## Phase 6 — Pilot readiness

- Complete privacy, security, and operational review.
- Add monitoring, alerting, backups, retention and incident response.
- Run duplicate-webhook, retry, timeout, provider-failure and language tests.
- Conduct a limited, consented pilot only after institutional approvals.

## Release gates

No AI-generated report is considered verified until a worker explicitly confirms it. No clinical diagnosis, treatment advice, or autonomous ordering is permitted. Synthetic data must be used during development and demonstration.
