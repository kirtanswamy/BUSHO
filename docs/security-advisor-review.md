# Supabase security-advisor review

**Reviewed:** 17 November 2026  
**Configured project:** `BUSHO-Demo`, ref `qalfoqhtyrtenkuitvvt`, region `ap-south-1`. The separate project named `BUSHO` (`vufnjwkaaqtyukjcvknu`, `eu-central-1`) is not the project referenced by the current website configuration.

## Confirmed configuration

- Browser configuration and Vercel `connect-src` both point to `qalfoqhtyrtenkuitvvt`.
- The configured project is active and healthy.
- Four active profiles exist (worker, supervisor, platform administrator and storekeeper); two facilities are flagged synthetic; one worker, one closed report and four audit-log records exist.
- The separate `BUSHO` project has only two recorded migrations and no deployed Edge Functions in the current inspection. Do not deploy the application migrations to it by assumption.
- `provisioning_operations`, `facility_registry_candidates` and `facility_registry_import_batches` have RLS enabled and no policies. A direct grants inspection confirmed only `postgres` and `service_role` have table privileges; `anon` and `authenticated` do not. These no-policy warnings are intentional server-only boundaries, not anonymous exposure.
- One synthetic worker row had a legacy `consent_at` timestamp created by the old provisioning code. It was cleared because it was not evidence of the worker's own acknowledgement or consent. New provisioning no longer writes that field.

## Security advisor findings

### Action required / limitation

- **Leaked password protection disabled.** Supabase's built-in HaveIBeenPwned password screening is unavailable on the current Free plan; Supabase documents it as Pro and above. Enable it if/when the project is upgraded to a plan that supports it. In the meantime, use a strong minimum password length and MFA where feasible; do not describe the current Auth configuration as having breached-password screening.

### Warnings requiring planned remediation

- **`btree_gist` installed in `public`.** This is an extension-placement warning. Moving an extension can affect dependent objects; inspect extension dependencies and rehearse on a non-production branch before changing it.
- **CSP is report-only.** `vercel.json` currently sends `Content-Security-Policy-Report-Only`; it reports violations but does not block them. Do not claim that an enforcing CSP is active. Enforce only after portal, auth, Supabase, fonts and optional speech workflows are tested against a complete policy.
- **15 unindexed foreign keys and 47 unused indexes** were reported by the performance advisor. Unused-index results on a lightly used demo database are not sufficient reason to drop indexes. Review high-value foreign-key indexes against expected query patterns and actual workload before modifying schema.

## Consent and privacy data integrity

- The old administrator checkbox was named and worded as though it proved worker consent. The server also wrote `workers.consent_at` at invitation time. Neither action proved the worker received the notice or consented.
- The updated form records a narrowly scoped administrator attestation that Privacy Notice v1.1 was shared before invitation. The server validates it and stores its version and attestation timestamp in the existing service-only provisioning operation payload.
- This is **not** a worker acknowledgement, and is **not** consent evidence. There is currently no worker-side notice acknowledgement/consent-management workflow. A real pilot must establish a lawful basis and implement the correct notice/acknowledgement and rights process before processing real personal data.

## Release gate

Before any real-data pilot: independent security review, RLS and role-boundary testing, tested backup/restore and incident response, provider DPA/region/retention review, a legally reviewed retention/deletion process, leaked-password protection where plan permits, CSP enforcement after compatibility testing, and an approved privacy/legal basis.