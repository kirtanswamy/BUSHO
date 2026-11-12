-- Part 2I follow-up: allow authenticated supervisors to supply the
-- client-generated idempotency key on recommendation inserts.
-- Existing table RLS and the supervisor insert policy remain authoritative.
begin;

grant insert (submission_key)
  on public.replenishment_requests
  to authenticated;

commit;
