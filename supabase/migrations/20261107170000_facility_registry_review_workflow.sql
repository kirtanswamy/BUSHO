-- Part 2C: provenance-backed facility registry staging and audited promotion.
-- Applied by CI only until a separately approved live migration is scheduled.

create table if not exists public.facility_registry_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_authority text not null check (length(btrim(source_authority)) between 3 and 160),
  source_date date not null,
  source_url text not null check (source_url ~* '^https://'),
  imported_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'staging'
    check (status in ('staging','reviewing','completed','cancelled')),
  expected_rows integer not null check (expected_rows between 1 and 10000),
  received_rows integer not null default 0 check (received_rows >= 0),
  verified_rows integer not null default 0 check (verified_rows >= 0),
  rejected_rows integer not null default 0 check (rejected_rows >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint facility_registry_batch_counts_check
    check (received_rows <= expected_rows and verified_rows + rejected_rows <= received_rows)
);

create table if not exists public.facility_registry_candidates (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.facility_registry_import_batches(id) on delete cascade,
  external_registry_id text not null check (length(btrim(external_registry_id)) between 1 and 120),
  name text not null check (length(btrim(name)) between 2 and 180),
  state_lgd_code text not null references public.states(lgd_code),
  district_lgd_code text not null references public.districts(lgd_code),
  block_lgd_code text references public.blocks(lgd_code),
  facility_type text not null check (facility_type in ('aam_shc','phc','chc','district_hospital','sub_centre','other')),
  source_row integer not null check (source_row >= 2),
  review_flags text[] not null default '{}',
  verification_status text not null default 'needs_review'
    check (verification_status in ('needs_review','verified','rejected')),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  facility_id uuid references public.facilities(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint facility_registry_candidate_batch_external_id_key unique (batch_id, external_registry_id),
  constraint facility_registry_candidate_batch_source_row_key unique (batch_id, source_row),
  constraint facility_registry_candidate_review_state_check check (
    (verification_status = 'needs_review' and reviewed_by is null and reviewed_at is null and facility_id is null)
    or (verification_status = 'verified' and reviewed_by is not null and reviewed_at is not null and facility_id is not null)
    or (verification_status = 'rejected' and reviewed_by is not null and reviewed_at is not null and facility_id is null)
  )
);

create index if not exists facility_registry_batches_owner_created_idx
  on public.facility_registry_import_batches (imported_by, created_at desc);
create index if not exists facility_registry_candidates_batch_status_idx
  on public.facility_registry_candidates (batch_id, verification_status, source_row);
create index if not exists facility_registry_candidates_district_idx
  on public.facility_registry_candidates (state_lgd_code, district_lgd_code, verification_status);

create unique index if not exists facilities_external_registry_id_unique
  on public.facilities (external_registry_id)
  where external_registry_id is not null and length(btrim(external_registry_id)) > 0;

alter table public.facility_registry_import_batches enable row level security;
alter table public.facility_registry_candidates enable row level security;
revoke all privileges on public.facility_registry_import_batches from anon, authenticated;
revoke all privileges on public.facility_registry_candidates from anon, authenticated;
grant all privileges on public.facility_registry_import_batches to service_role;
grant all privileges on public.facility_registry_candidates to service_role;

create or replace function app_private.stage_facility_registry_candidates(
  p_batch_id uuid,
  p_actor_id uuid,
  p_candidates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, app_private
as $
declare
  v_profile public.profiles%rowtype;
  v_batch public.facility_registry_import_batches%rowtype;
  v_scope record;
  v_count integer;
  v_inserted integer;
begin
  if p_batch_id is null or p_actor_id is null or jsonb_typeof(p_candidates) <> 'array' then
    raise exception using errcode = '22023', message = 'Batch, actor and a JSON array of candidates are required.';
  end if;
  v_count := jsonb_array_length(p_candidates);
  if v_count < 1 or v_count > 250 then
    raise exception using errcode = '22023', message = 'Stage between 1 and 250 candidates per request.';
  end if;

  select * into v_profile from public.profiles where id = p_actor_id for share;
  if not found or v_profile.status <> 'active' or v_profile.role not in ('platform_admin','state_admin','district_admin') then
    raise exception using errcode = '42501', message = 'An active authorised administrator is required.';
  end if;
  select * into v_batch from public.facility_registry_import_batches
  where id = p_batch_id and imported_by = p_actor_id for update;
  if not found or v_batch.status not in ('staging','reviewing') then
    raise exception using errcode = '55000', message = 'This import batch is not open for staging.';
  end if;
  if v_batch.received_rows + v_count > v_batch.expected_rows then
    raise exception using errcode = '22023', message = 'Staged rows would exceed the declared batch size.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_candidates) x
    where jsonb_typeof(x) <> 'object'
      or coalesce(x->>'external_registry_id','') = ''
      or coalesce(x->>'name','') = ''
      or coalesce(x->>'state_lgd_code','') <> '22'
      or coalesce(x->>'district_lgd_code','') = ''
      or coalesce(x->>'facility_type','') not in ('aam_shc','phc','chc','district_hospital','sub_centre','other')
      or coalesce(x->>'source_row','') !~ '^[0-9]+
  p_candidate_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_review_note text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, app_private
as $$
declare
  v_profile public.profiles%rowtype;
  v_candidate public.facility_registry_candidates%rowtype;
  v_batch public.facility_registry_import_batches%rowtype;
  v_scope record;
  v_facility_id uuid;
  v_state_name text;
  v_district_name text;
  v_now timestamptz := now();
begin
  if p_candidate_id is null or p_reviewer_id is null then
    raise exception using errcode = '22023', message = 'Candidate and reviewer IDs are required.';
  end if;
  if p_decision not in ('verify','reject') then
    raise exception using errcode = '22023', message = 'Decision must be verify or reject.';
  end if;
  if length(btrim(coalesce(p_review_note,''))) < 8 or length(p_review_note) > 1000 then
    raise exception using errcode = '22023', message = 'A review note between 8 and 1000 characters is required.';
  end if;

  select * into v_profile from public.profiles where id = p_reviewer_id for share;
  if not found or v_profile.status <> 'active' or v_profile.role not in ('platform_admin','state_admin','district_admin') then
    raise exception using errcode = '42501', message = 'An active authorised administrator is required.';
  end if;

  select * into v_candidate from public.facility_registry_candidates
  where id = p_candidate_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Facility registry candidate was not found.';
  end if;
  select * into v_batch from public.facility_registry_import_batches
  where id = v_candidate.batch_id for update;
  if not found or v_batch.status not in ('reviewing','staging') then
    raise exception using errcode = '55000', message = 'This import batch is not open for review.';
  end if;
  if v_candidate.verification_status <> 'needs_review' then
    raise exception using errcode = '55000', message = 'This candidate has already been reviewed.';
  end if;

  if v_profile.role <> 'platform_admin' then
    select * into v_scope
    from public.user_scope_assignments s
    where s.user_id = p_reviewer_id
      and s.is_active = true
      and s.valid_from <= v_now
      and (s.valid_until is null or s.valid_until > v_now)
      and s.state_lgd_code = v_candidate.state_lgd_code
      and (
        (v_profile.role = 'state_admin' and s.scope_level = 'state' and s.scope_role = 'state_admin')
        or
        (v_profile.role = 'district_admin' and s.scope_level = 'district'
          and s.scope_role = 'district_admin' and s.district_lgd_code = v_candidate.district_lgd_code)
      )
    limit 1;
    if not found then
      raise exception using errcode = '42501', message = 'Candidate is outside the reviewer geographic scope.';
    end if;
  end if;

  if p_decision = 'verify' then
    if cardinality(v_candidate.review_flags) > 0 then
      raise exception using errcode = '55000', message = 'Resolve all mapping and data-quality flags before verification.';
    end if;
    if v_candidate.block_lgd_code is not null and not exists (
      select 1 from public.blocks b
      where b.lgd_code = v_candidate.block_lgd_code
        and b.state_lgd_code = v_candidate.state_lgd_code
        and b.district_lgd_code = v_candidate.district_lgd_code
        and b.mapping_review_required = false and b.is_selectable = true
    ) then
      raise exception using errcode = '23503', message = 'The facility block mapping is ambiguous or invalid.';
    end if;
    if v_candidate.state_lgd_code <> '22' then
      raise exception using errcode = '23514', message = 'Only Chhattisgarh facilities can be promoted by this workflow.';
    end if;
    if exists (
      select 1 from public.facilities f
      where f.external_registry_id = v_candidate.external_registry_id
    ) then
      raise exception using errcode = '23505', message = 'This external registry ID is already assigned to a facility.';
    end if;
    if exists (
      select 1 from public.facilities f
      where f.state_lgd_code = v_candidate.state_lgd_code
        and f.district_lgd_code = v_candidate.district_lgd_code
        and lower(regexp_replace(btrim(f.name), '\s+', ' ', 'g')) =
            lower(regexp_replace(btrim(v_candidate.name), '\s+', ' ', 'g'))
    ) then
      raise exception using errcode = '23505', message = 'A facility with the same normalised name already exists in this district; reconcile identities before verification.';
    end if;

    select name into v_state_name from public.states where lgd_code = v_candidate.state_lgd_code;
    select name into v_district_name from public.districts where lgd_code = v_candidate.district_lgd_code;
    if v_state_name is null or v_district_name is null then
      raise exception using errcode = '23503', message = 'Facility geography could not be resolved.';
    end if;

    insert into public.facilities (
      name, district, state, state_lgd_code, district_lgd_code, block_lgd_code,
      facility_type, registry_source, registry_source_date, external_registry_id,
      verification_status, is_synthetic, is_active
    ) values (
      v_candidate.name, v_district_name, v_state_name, v_candidate.state_lgd_code,
      v_candidate.district_lgd_code, v_candidate.block_lgd_code,
      v_candidate.facility_type, v_batch.source_authority, v_batch.source_date::text,
      v_candidate.external_registry_id, 'verified', false, true
    ) returning id into v_facility_id;

    update public.facility_registry_candidates
    set verification_status = 'verified', review_note = btrim(p_review_note),
        reviewed_by = p_reviewer_id, reviewed_at = v_now, facility_id = v_facility_id
    where id = p_candidate_id;
  else
    update public.facility_registry_candidates
    set verification_status = 'rejected', review_note = btrim(p_review_note),
        reviewed_by = p_reviewer_id, reviewed_at = v_now
    where id = p_candidate_id;
  end if;

  update public.facility_registry_import_batches b
  set verified_rows = (select count(*) from public.facility_registry_candidates c where c.batch_id = b.id and c.verification_status = 'verified'),
      rejected_rows = (select count(*) from public.facility_registry_candidates c where c.batch_id = b.id and c.verification_status = 'rejected'),
      status = case when b.status = 'staging' then 'reviewing' else b.status end
  where b.id = v_batch.id;

  if p_decision = 'verify' then
    insert into public.audit_logs (actor_worker_id, action, entity_type, entity_id, metadata)
    values (null, 'facility_registry_candidate_verified', 'facility', v_facility_id,
      jsonb_build_object('candidate_id', p_candidate_id, 'batch_id', v_batch.id,
        'reviewer_id', p_reviewer_id, 'external_registry_id', v_candidate.external_registry_id,
        'source_authority', v_batch.source_authority, 'source_date', v_batch.source_date,
        'review_note', btrim(p_review_note)));
  else
    insert into public.audit_logs (actor_worker_id, action, entity_type, entity_id, metadata)
    values (null, 'facility_registry_candidate_rejected', 'facility_registry_candidate', p_candidate_id,
      jsonb_build_object('batch_id', v_batch.id, 'reviewer_id', p_reviewer_id,
        'external_registry_id', v_candidate.external_registry_id, 'review_note', btrim(p_review_note)));
  end if;

  return jsonb_build_object(
    'candidateId', p_candidate_id,
    'decision', p_decision,
    'facilityId', v_facility_id,
    'batchId', v_batch.id
  );
end;
$$;

revoke all on function app_private.stage_facility_registry_candidates(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function app_private.stage_facility_registry_candidates(uuid,uuid,jsonb) to service_role;
revoke all on function app_private.complete_facility_registry_batch(uuid,uuid) from public, anon, authenticated;
grant execute on function app_private.complete_facility_registry_batch(uuid,uuid) to service_role;
revoke all on function app_private.review_facility_registry_candidate(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function app_private.review_facility_registry_candidate(uuid,uuid,text,text) to service_role;

  ) then
    raise exception using errcode = '22023', message = 'One or more candidate records contain invalid required fields.';
  end if;

  if v_profile.role = 'state_admin' and exists (
    select 1 from jsonb_array_elements(p_candidates) x
    where not exists (
      select 1 from public.user_scope_assignments s
      where s.user_id = p_actor_id and s.is_active
        and s.scope_level = 'state' and s.scope_role = 'state_admin'
        and s.state_lgd_code = x->>'state_lgd_code'
        and s.valid_from <= now() and (s.valid_until is null or s.valid_until > now())
    )
  ) then
    raise exception using errcode = '42501', message = 'One or more candidates are outside the administrator state scope.';
  end if;
  if v_profile.role = 'district_admin' and exists (
    select 1 from jsonb_array_elements(p_candidates) x
    where not exists (
      select 1 from public.user_scope_assignments s
      where s.user_id = p_actor_id and s.is_active
        and s.scope_level = 'district' and s.scope_role = 'district_admin'
        and s.state_lgd_code = x->>'state_lgd_code'
        and s.district_lgd_code = x->>'district_lgd_code'
        and s.valid_from <= now() and (s.valid_until is null or s.valid_until > now())
    )
  ) then
    raise exception using errcode = '42501', message = 'One or more candidates are outside the administrator district scope.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_candidates) x
    left join public.districts d on d.lgd_code = x->>'district_lgd_code'
      and d.state_lgd_code = x->>'state_lgd_code'
    where d.lgd_code is null
  ) then
    raise exception using errcode = '23503', message = 'One or more candidate districts are not valid Chhattisgarh LGD records.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_candidates) x
    where coalesce(x->>'block_lgd_code','') <> ''
      and not exists (
        select 1 from public.blocks b
        where b.lgd_code = x->>'block_lgd_code'
          and b.state_lgd_code = x->>'state_lgd_code'
          and b.district_lgd_code = x->>'district_lgd_code'
          and b.mapping_review_required = false and b.is_selectable = true
      )
  ) then
    raise exception using errcode = '23503', message = 'One or more block mappings are ambiguous, invalid or not selectable.';
  end if;

  insert into public.facility_registry_candidates (
    batch_id, external_registry_id, name, state_lgd_code, district_lgd_code,
    block_lgd_code, facility_type, source_row, review_flags
  )
  select p_batch_id, x->>'external_registry_id', x->>'name',
    x->>'state_lgd_code', x->>'district_lgd_code',
    nullif(x->>'block_lgd_code',''), x->>'facility_type',
    (x->>'source_row')::integer,
    case when jsonb_typeof(x->'review_flags') = 'array'
      then array(select jsonb_array_elements_text(x->'review_flags'))
      else '{}'::text[] end
  from jsonb_array_elements(p_candidates) x;

  get diagnostics v_inserted = row_count;
  update public.facility_registry_import_batches
  set received_rows = received_rows + v_inserted,
      status = 'reviewing'
  where id = p_batch_id;

  return jsonb_build_object('batchId',p_batch_id,'staged',v_inserted);
end;
$;

create or replace function app_private.complete_facility_registry_batch(
  p_batch_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, app_private
as $
declare
  v_batch public.facility_registry_import_batches%rowtype;
  v_profile public.profiles%rowtype;
  v_pending integer;
begin
  select * into v_profile from public.profiles where id = p_actor_id for share;
  if not found or v_profile.status <> 'active' or v_profile.role not in ('platform_admin','state_admin','district_admin') then
    raise exception using errcode = '42501', message = 'An active authorised administrator is required.';
  end if;
  select * into v_batch from public.facility_registry_import_batches
  where id = p_batch_id and imported_by = p_actor_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Import batch was not found.'; end if;
  if v_batch.received_rows <> v_batch.expected_rows then
    raise exception using errcode = '55000', message = 'All declared source rows must be staged before completion.';
  end if;
  select count(*) into v_pending from public.facility_registry_candidates
  where batch_id = p_batch_id and verification_status = 'needs_review';
  if v_pending > 0 then
    raise exception using errcode = '55000', message = 'Every staged candidate must be verified or rejected before batch completion.';
  end if;
  update public.facility_registry_import_batches
  set status = 'completed', completed_at = now()
  where id = p_batch_id;
  return jsonb_build_object('batchId',p_batch_id,'status','completed');
end;
$;

create or replace function app_private.review_facility_registry_candidate(
  p_candidate_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_review_note text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, app_private
as $$
declare
  v_profile public.profiles%rowtype;
  v_candidate public.facility_registry_candidates%rowtype;
  v_batch public.facility_registry_import_batches%rowtype;
  v_scope record;
  v_facility_id uuid;
  v_state_name text;
  v_district_name text;
  v_now timestamptz := now();
begin
  if p_candidate_id is null or p_reviewer_id is null then
    raise exception using errcode = '22023', message = 'Candidate and reviewer IDs are required.';
  end if;
  if p_decision not in ('verify','reject') then
    raise exception using errcode = '22023', message = 'Decision must be verify or reject.';
  end if;
  if length(btrim(coalesce(p_review_note,''))) < 8 or length(p_review_note) > 1000 then
    raise exception using errcode = '22023', message = 'A review note between 8 and 1000 characters is required.';
  end if;

  select * into v_profile from public.profiles where id = p_reviewer_id for share;
  if not found or v_profile.status <> 'active' or v_profile.role not in ('platform_admin','state_admin','district_admin') then
    raise exception using errcode = '42501', message = 'An active authorised administrator is required.';
  end if;

  select * into v_candidate from public.facility_registry_candidates
  where id = p_candidate_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Facility registry candidate was not found.';
  end if;
  select * into v_batch from public.facility_registry_import_batches
  where id = v_candidate.batch_id for update;
  if not found or v_batch.status not in ('reviewing','staging') then
    raise exception using errcode = '55000', message = 'This import batch is not open for review.';
  end if;
  if v_candidate.verification_status <> 'needs_review' then
    raise exception using errcode = '55000', message = 'This candidate has already been reviewed.';
  end if;

  if v_profile.role <> 'platform_admin' then
    select * into v_scope
    from public.user_scope_assignments s
    where s.user_id = p_reviewer_id
      and s.is_active = true
      and s.valid_from <= v_now
      and (s.valid_until is null or s.valid_until > v_now)
      and s.state_lgd_code = v_candidate.state_lgd_code
      and (
        (v_profile.role = 'state_admin' and s.scope_level = 'state' and s.scope_role = 'state_admin')
        or
        (v_profile.role = 'district_admin' and s.scope_level = 'district'
          and s.scope_role = 'district_admin' and s.district_lgd_code = v_candidate.district_lgd_code)
      )
    limit 1;
    if not found then
      raise exception using errcode = '42501', message = 'Candidate is outside the reviewer geographic scope.';
    end if;
  end if;

  if p_decision = 'verify' then
    if cardinality(v_candidate.review_flags) > 0 then
      raise exception using errcode = '55000', message = 'Resolve all mapping and data-quality flags before verification.';
    end if;
    if v_candidate.state_lgd_code <> '22' then
      raise exception using errcode = '23514', message = 'Only Chhattisgarh facilities can be promoted by this workflow.';
    end if;
    if exists (
      select 1 from public.facilities f
      where f.external_registry_id = v_candidate.external_registry_id
    ) then
      raise exception using errcode = '23505', message = 'This external registry ID is already assigned to a facility.';
    end if;
    if exists (
      select 1 from public.facilities f
      where f.state_lgd_code = v_candidate.state_lgd_code
        and f.district_lgd_code = v_candidate.district_lgd_code
        and lower(regexp_replace(btrim(f.name), '\s+', ' ', 'g')) =
            lower(regexp_replace(btrim(v_candidate.name), '\s+', ' ', 'g'))
    ) then
      raise exception using errcode = '23505', message = 'A facility with the same normalised name already exists in this district; reconcile identities before verification.';
    end if;

    select name into v_state_name from public.states where lgd_code = v_candidate.state_lgd_code;
    select name into v_district_name from public.districts where lgd_code = v_candidate.district_lgd_code;
    if v_state_name is null or v_district_name is null then
      raise exception using errcode = '23503', message = 'Facility geography could not be resolved.';
    end if;

    insert into public.facilities (
      name, district, state, state_lgd_code, district_lgd_code, block_lgd_code,
      facility_type, registry_source, registry_source_date, external_registry_id,
      verification_status, is_synthetic, is_active
    ) values (
      v_candidate.name, v_district_name, v_state_name, v_candidate.state_lgd_code,
      v_candidate.district_lgd_code, v_candidate.block_lgd_code,
      v_candidate.facility_type, v_batch.source_authority, v_batch.source_date::text,
      v_candidate.external_registry_id, 'verified', false, true
    ) returning id into v_facility_id;

    update public.facility_registry_candidates
    set verification_status = 'verified', review_note = btrim(p_review_note),
        reviewed_by = p_reviewer_id, reviewed_at = v_now, facility_id = v_facility_id
    where id = p_candidate_id;
  else
    update public.facility_registry_candidates
    set verification_status = 'rejected', review_note = btrim(p_review_note),
        reviewed_by = p_reviewer_id, reviewed_at = v_now
    where id = p_candidate_id;
  end if;

  update public.facility_registry_import_batches b
  set verified_rows = (select count(*) from public.facility_registry_candidates c where c.batch_id = b.id and c.verification_status = 'verified'),
      rejected_rows = (select count(*) from public.facility_registry_candidates c where c.batch_id = b.id and c.verification_status = 'rejected'),
      status = case when b.status = 'staging' then 'reviewing' else b.status end
  where b.id = v_batch.id;

  if p_decision = 'verify' then
    insert into public.audit_logs (actor_worker_id, action, entity_type, entity_id, metadata)
    values (null, 'facility_registry_candidate_verified', 'facility', v_facility_id,
      jsonb_build_object('candidate_id', p_candidate_id, 'batch_id', v_batch.id,
        'reviewer_id', p_reviewer_id, 'external_registry_id', v_candidate.external_registry_id,
        'source_authority', v_batch.source_authority, 'source_date', v_batch.source_date,
        'review_note', btrim(p_review_note)));
  else
    insert into public.audit_logs (actor_worker_id, action, entity_type, entity_id, metadata)
    values (null, 'facility_registry_candidate_rejected', 'facility_registry_candidate', p_candidate_id,
      jsonb_build_object('batch_id', v_batch.id, 'reviewer_id', p_reviewer_id,
        'external_registry_id', v_candidate.external_registry_id, 'review_note', btrim(p_review_note)));
  end if;

  return jsonb_build_object(
    'candidateId', p_candidate_id,
    'decision', p_decision,
    'facilityId', v_facility_id,
    'batchId', v_batch.id
  );
end;
$$;

revoke all on function app_private.review_facility_registry_candidate(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function app_private.review_facility_registry_candidate(uuid,uuid,text,text) to service_role;


-- Public RPC wrappers are executable only by the service role. The implementation
-- remains in app_private and cannot be called by browser-authenticated users.
create or replace function public.stage_facility_registry_candidates(
  p_batch_id uuid, p_actor_id uuid, p_candidates jsonb
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, app_private
as $$
  select app_private.stage_facility_registry_candidates(p_batch_id,p_actor_id,p_candidates);
$$;

create or replace function public.review_facility_registry_candidate(
  p_candidate_id uuid, p_reviewer_id uuid, p_decision text, p_review_note text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, app_private
as $$
  select app_private.review_facility_registry_candidate(p_candidate_id,p_reviewer_id,p_decision,p_review_note);
$$;

create or replace function public.complete_facility_registry_batch(
  p_batch_id uuid, p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, app_private
as $$
  select app_private.complete_facility_registry_batch(p_batch_id,p_actor_id);
$$;

revoke all on function public.stage_facility_registry_candidates(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.stage_facility_registry_candidates(uuid,uuid,jsonb) to service_role;
revoke all on function public.review_facility_registry_candidate(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.review_facility_registry_candidate(uuid,uuid,text,text) to service_role;
revoke all on function public.complete_facility_registry_batch(uuid,uuid) from public, anon, authenticated;
grant execute on function public.complete_facility_registry_batch(uuid,uuid) to service_role;
