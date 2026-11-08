# BUSHO local Supabase E2E — Part 2H.9

This is a disposable local-only test workflow. It must not be linked to the production project.

## Prerequisites
- Docker Desktop (or another Docker-compatible runtime) running.
- Supabase CLI installed.
- Node.js 18 or newer.
- Repository checked out on `feature/chhattisgarh-operational-workflow`.

## Start the local Supabase stack
From the repository root:

```bash
supabase start
supabase status --output env
```

Use the local API URL, anon key, and service-role key printed by the CLI. Export them into the current terminal session (do not commit them):

PowerShell:
```powershell
$env:API_URL = "http://127.0.0.1:54321"
$env:ANON_KEY = "<local anon key>"
$env:SERVICE_ROLE_KEY = "<local service role key>"
```

macOS/Linux:
```bash
export API_URL="http://127.0.0.1:54321"
export ANON_KEY="<local anon key>"
export SERVICE_ROLE_KEY="<local service role key>"
```

## Run the synthetic multi-user test

```bash
npm run local:e2e
```

The script creates four temporary Auth users and two synthetic facilities, activates two workers and two supervisors, assigns one worker and one supervisor to each facility, then tests:
- Password authentication and profile creation.
- Facility isolation for each worker and supervisor.
- Worker draft creation and submission.
- Same-facility supervisor visibility and verification.
- Cross-facility report isolation.
- Anonymous profile access denial.

All records are synthetic and the script attempts to clean up its users and facility data in a `finally` block. If interrupted, run `supabase db reset` to discard the local database and recreate it from migrations. Never run this against a linked remote database.

## Safety boundary
- Do not run `supabase link`, `supabase db push`, `supabase db reset --linked`, or `supabase functions deploy` for this test.
- No live patients, facility roster, inventory, or credentials are used.
- This smoke test uses direct Auth and PostgREST APIs against the local Supabase stack. It is not a full browser E2E and does not yet validate the storekeeper receipt workflow end to end.
- A passing local run is evidence of local behavior only. Hosted non-production validation and real facility/pharmacist operational review remain separate gates.
