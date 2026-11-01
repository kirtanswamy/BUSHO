# Security Policy

BUSHO is a **hackathon prototype** that runs in the browser with **synthetic data only**. It has no backend, no accounts and no real patient data. Even so, we take reports seriously.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Use GitHub's private reporting instead:

**Security tab > Report a vulnerability** (https://github.com/kirtanswamy/BUSHO/security/advisories/new)

Include what you found, how to reproduce it, and the possible impact. We aim to acknowledge reports within a few days.

## Scope

In scope: the static demo, `server.mjs`, the deployment configuration, and anything that could expose files or run unexpected code in a visitor's browser.

Out of scope: the absence of production features that the README already lists as missing (authentication, shared backend, encryption at rest, real integrations).

## Important

Never enter real patient or personally identifiable information into the demo. Any real-world pilot would first need authentication, a protected backend, audit logging and a privacy and security review.
