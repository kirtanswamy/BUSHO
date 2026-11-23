# Security Policy

## Project status and scope

BUSHO is a development-stage public-health workflow prototype. The current codebase includes a web client, Supabase authentication and database workflows, role/facility access controls, and server-side Edge Functions. It is therefore **not accurate** to describe the project as browser-only or as having no backend or accounts.

The prototype is not approved for real patient data, clinical use, or production public-health operations. Use synthetic or expressly approved test data only. Do not submit patient-identifying information, medical records, government identifiers, credentials, or other sensitive information.

## Reporting a vulnerability

Please do not disclose security issues in public GitHub issues. Use [GitHub Security Advisories](https://github.com/kirtanswamy/BUSHO/security/advisories/new) for private vulnerability reporting. Include affected component, impact, reproducible steps and (if possible) a suggested mitigation. Avoid including real personal or health data in the report.

For general privacy or project security questions, contact [kirtankswamy@gmail.com](mailto:kirtankswamy@gmail.com). Do not send passwords, tokens or patient information by email. The project contact is not a 24/7 incident-response service or a formally appointed security officer.

## In-scope components

- Web application, static assets and client-side scripts.
- Supabase authentication, database schema, row-level security policies, triggers and Edge Functions maintained by this repository.
- Account provisioning, role/facility assignment and workflow/audit paths.
- Vercel deployment configuration and project-controlled runtime configuration.
- Dependency and third-party integration risks introduced by project code.

Third-party provider infrastructure itself should be reported to the relevant provider through its security process.

## Coordinated disclosure

Please allow the project maintainers reasonable time to investigate and prepare a fix before public disclosure. We will acknowledge reports as soon as reasonably practicable, assess severity and communicate next steps. No fixed response or remediation SLA is currently offered.

## Current security limitations

- The application and its backend have not been independently penetration-tested or certified.
- A configured authentication or role model is not a guarantee that every route, policy or deployment is secure.
- Provider region, retention, backup, incident-response and subprocessor settings must be verified for the active deployment.
- Do not assume that all account, audit, workflow or backup records can be deleted immediately or through a self-service control.
- Do not use the prototype as a production health system or store real patient or sensitive personal data.

## Before any real-world pilot

A pilot requires documented ownership and lawful purpose, privacy/legal review, threat modelling, independent security testing, verified RLS and least-privilege policies, tested backup/restore and incident response, retention/deletion controls, provider and data-transfer review, accessibility testing, and written authorisation from the participating organisation.