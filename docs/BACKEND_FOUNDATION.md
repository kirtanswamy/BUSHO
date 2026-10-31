# BUSHO Backend Foundation

## Scope of this phase

This change introduces the first backend foundation without changing the existing static dashboard:

- Node.js 20+ API service under `apps/api`
- Express API with Helmet security headers
- Supabase PostgreSQL connection pool
- Liveness endpoint: `GET /healthz`
- Readiness endpoint: `GET /readyz`
- Initial operational database migration
- Environment-variable template
- API smoke tests

WhatsApp webhooks, AI providers, voice processing, authentication, report endpoints, and dashboard integration are deliberately not implemented in this phase.

## Local setup

1. Install Node.js 20 or newer.
2. Open a terminal in `apps/api`.
3. Install dependencies:

   ```sh
   npm install
   ```

4. Copy `.env.example` to `.env` and add a Supabase PostgreSQL connection string to `DATABASE_URL`.
5. Start the API:

   ```sh
   npm run dev
   ```

6. Check `http://localhost:3000/healthz` and `http://localhost:3000/readyz`.

The liveness endpoint should return HTTP 200 even before the database is configured. Readiness returns HTTP 503 until the database connection succeeds.

## Supabase database setup

1. Create a Supabase project.
2. Open **Project Settings → Database → Connection string**.
3. Copy the connection string intended for a persistent Node.js service. If using the Supabase pooler, choose the pooler mode appropriate for a long-running Railway process.
4. Add the connection string to the private Railway/local environment as `DATABASE_URL`.
5. Open the Supabase SQL Editor and run `database/migrations/001_initial_schema.sql`.
6. Confirm the tables exist before deploying the API.

Never put the database password, service-role key, or connection string in frontend code or source control. This first API uses a server-side PostgreSQL connection; do not expose privileged credentials to the browser.

## Railway deployment

1. Create a Railway project and connect the GitHub repository.
2. Set the service root directory to `/apps/api`.
3. Set the start command to `npm start` if Railway does not detect the package script.
4. Add `DATABASE_URL`, `DATABASE_SSL=true`, and `NODE_ENV=production` as service variables.
5. Railway provides the port; the API listens on `process.env.PORT` and binds to `0.0.0.0`.
6. Configure the Railway health check path as `/healthz`.
7. After deployment, verify `/healthz` and `/readyz`.

Do not add WhatsApp or AI secrets until their respective integration phases. Do not deploy with a blank database connection and treat a 503 readiness response as success.

## Database migration policy

Migrations are applied deliberately through the Supabase SQL Editor in this phase. Do not make the application automatically run schema-changing SQL on startup. Keep future migrations numbered and additive where possible.

## Security notes

- No authentication is implemented yet; do not expose report or admin data through this API.
- Helmet is enabled and JSON request bodies are limited to 256 KB.
- The database connection is server-side only.
- The schema models facility-level operational reporting and does not require patient identifiers.
- Production use requires authentication, facility-level authorization, audit review, privacy review, backups, retention controls, and security testing.
