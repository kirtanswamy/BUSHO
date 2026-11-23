-- Durable progress records for privileged account provisioning.
-- The table is service-role only; browser users never read or mutate it directly.
create table if not exists public.provisioning_operations (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete restrict,
  idempotency_key uuid not null,
  target_email text not null,
  request_fingerprint text not null,
  target_role text not null check (target_role in ('worker','supervisor','storekeeper','district_admin','state_admin')),
  status text not null default 'in_progress'
    check (status in ('in_progress','completed','failed','reconciliation_required')),
  current_step text not null default 'accepted',
  auth_user_id uuid references auth.users(id) on delete set null,
  error_code text,
  failure_detail text,
  result jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (requested_by, idempotency_key)
);

create index if not exists provisioning_operations_recovery_idx
  on public.provisioning_operations (status, updated_at)
  where status in ('in_progress','reconciliation_required');

create index if not exists provisioning_operations_requester_idx
  on public.provisioning_operations (requested_by, started_at desc);

alter table public.provisioning_operations enable row level security;
revoke all on public.provisioning_operations from anon, authenticated;
grant all on public.provisioning_operations to service_role;

create or replace function app_private.set_provisioning_operation_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists provisioning_operations_updated_at on public.provisioning_operations;
create trigger provisioning_operations_updated_at
before update on public.provisioning_operations
for each row execute function app_private.set_provisioning_operation_updated_at();

comment on table public.provisioning_operations is
  'Service-role-only durable progress ledger for account provisioning; in-progress rows require reconciliation after interrupted execution.';
comment on column public.provisioning_operations.idempotency_key is
  'Client-generated UUID reused for retries of one intended provisioning action.';
comment on column public.provisioning_operations.current_step is
  'Last durable step reached; not proof that an external side effect completed unless auth_user_id or related records confirm it.';
