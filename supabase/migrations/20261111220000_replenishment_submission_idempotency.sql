-- Part 2I: idempotent supervisor replenishment recommendation submissions.
-- A retry key is scoped to the authenticated supervisor. It does not impose
-- one-recommendation-per-report or one-recommendation-per-item semantics.
begin;

alter table public.replenishment_requests
  add column if not exists submission_key uuid;

create unique index if not exists replenishment_requests_creator_submission_key_uidx
  on public.replenishment_requests(created_by_user_id, submission_key)
  where submission_key is not null;

create or replace function app_private.guard_replenishment_submission_key()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.submission_key is distinct from old.submission_key then
    raise exception 'A replenishment submission key is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists busho_guard_replenishment_submission_key on public.replenishment_requests;
create trigger busho_guard_replenishment_submission_key
before update of submission_key on public.replenishment_requests
for each row execute function app_private.guard_replenishment_submission_key();

revoke all on function app_private.guard_replenishment_submission_key() from public, anon, authenticated;

commit;
