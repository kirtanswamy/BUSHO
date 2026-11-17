-- Preserve the validated intent needed to compare incomplete operations
-- with their Auth/profile/assignment records during administrator reconciliation.
alter table public.provisioning_operations
  add column if not exists request_payload jsonb not null default '{}'::jsonb;

comment on column public.provisioning_operations.request_payload is
  'Validated non-secret provisioning intent: display name, preferred language, facility IDs, scope and administrator attestation that privacy notice v1.0 was shared with the invitee. This is not worker consent. Excludes credentials and invitation tokens.';
