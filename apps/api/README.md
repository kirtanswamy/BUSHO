# BUSHO API

Node.js backend foundation for BUSHO. The existing root-level static prototype remains separate.

## Requirements

- Node.js 20+
- Supabase PostgreSQL database

## Install and run

```sh
npm install
cp .env.example .env
npm run dev
```

Set `DATABASE_URL` in `.env` before expecting `/readyz` to pass.

## Routes

- `GET /healthz` — process liveness
- `GET /readyz` — readiness including database connectivity

## Test

```sh
npm test
```

See [Backend Foundation](../../docs/BACKEND_FOUNDATION.md) for Supabase and Railway setup.
