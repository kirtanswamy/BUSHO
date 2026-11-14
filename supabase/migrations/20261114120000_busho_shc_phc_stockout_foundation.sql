-- BUSHO SHC-to-PHC stockout exception workflow foundation.
-- Additive only. Coordination/evidence layer, not an official stock ledger.
-- No facilities, users, stock balances, government references or patient data are seeded.
begin;

create table if not exists public.facility_service_links (
  id uuid primary key default gen_random_uuid(),
  shc_facility_id uuid not null references public.facilities(id) on delete restrict,
  phc_facility_id uuid not null references public.facilities(id) on delete restrict,
  relationship_type text not null default 'shc_reports_to_phc' check (relationship_type = 'shc_reports_to_phc'),
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','needs_review','inactive')),
  source_authority text, source_reference text, effective_from date, effective_until date,
  verified_by_user_id uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  data_mode text not null default 'operational' check (data_mode in ('operational','synthetic_demo')),
  created_at timestamptz not null default now(),
  constraint facility_service_links_distinct check (shc_facility_id <> phc_facility_id),
  constraint facility_service_links_dates check (effective_until is null or effective_from is null or effective_until >= effective_from),
  constraint facility_service_links_evidence check (verification_status <> 'verified' or (verified_at is not null and nullif(btrim(source_authority),'') is not null))
);
create unique index if not exists facility_service_links_active_pair_uidx on public.facility_service_links(shc_facility_id,phc_facility_id) where verification_status in ('pending','verified');
create index if not exists facility_service_links_phc_idx on public.facility_service_links(phc_facility_id,verification_status);

create or replace function app_private.guard_facility_service_link()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_shc public.facilities%rowtype; v_phc public.facilities%rowtype;
begin
  select * into v_shc from public.facilities where id=new.shc_facility_id;
  select * into v_phc from public.facilities where id=new.phc_facility_id;
  if v_shc.id is null or v_phc.id is null then raise exception 'Both linked facilities must exist'; end if;
  if v_shc.facility_type <> 'aam_shc' or v_phc.facility_type <> 'phc' then raise exception 'Link must connect an AAM-SHC to a PHC'; end if;
  if v_shc.is_synthetic is distinct from v_phc.is_synthetic then raise exception 'Synthetic and operational facilities cannot be linked'; end if;
  if new.data_mode <> (case when v_shc.is_synthetic then 'synthetic_demo' else 'operational' end) then raise exception 'Facility link data mode must match facility classification'; end if;
  if new.verification_status='verified' and (nullif(btrim(new.source_authority),'') is null or new.verified_at is null) then raise exception 'Verified links require source authority and timestamp'; end if;
  return new;
end; $$;
drop trigger if exists facility_service_links_guard on public.facility_service_links;
create trigger facility_service_links_guard before insert or update on public.facility_service_links for each row execute function app_private.guard_facility_service_link();

create table if not exists public.stockout_cases (
  id uuid primary key default gen_random_uuid(),
  shc_facility_id uuid not null references public.facilities(id) on delete restrict,
  phc_facility_id uuid not null references public.facilities(id) on delete restrict,
  submitted_by_worker_id uuid not null references public.workers(id) on delete restrict,
  medicine_name text not null, medicine_source_reference text,
  reported_quantity numeric not null check (reported_quantity>=0),
  requested_quantity numeric not null check (requested_quantity>0),
  quantity_unit text not null,
  observation_source text not null check (observation_source in ('physical_count','dispensing_box_check','paper_register','worker_report','other')),
  observed_at timestamptz not null, worker_note text,
  status text not null default 'draft' check (status in (
    'draft','submitted_to_phc','acknowledged_by_phc','under_phc_review','clarification_requested','resubmitted',
    'accepted_for_phc_action','phc_cannot_fulfil','official_indent_submitted','upstream_supply_received_at_phc',
    'phc_handover_recorded','collected_by_shc','partially_received_at_shc','received_at_shc','closed','cancelled')),
  phc_review_note text, phc_available_quantity numeric check (phc_available_quantity is null or phc_available_quantity>=0),
  official_system_name text, official_indent_reference text, official_indent_submitted_at timestamptz,
  upstream_receipt_reference text, upstream_received_at timestamptz,
  phc_handover_quantity numeric check (phc_handover_quantity is null or phc_handover_quantity>=0),
  phc_handover_reference text, phc_handover_at timestamptz,
  shc_collection_reference text, shc_collected_at timestamptz,
  shc_received_quantity numeric not null default 0 check (shc_received_quantity>=0),
  shc_receipt_reference text, shc_received_at timestamptz, discrepancy_note text,
  data_mode text not null default 'operational' check (data_mode in ('operational','synthetic_demo')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint stockout_case_receipt_not_over_handover check (phc_handover_quantity is null or shc_received_quantity<=phc_handover_quantity),
  constraint stockout_case_facilities_distinct check (shc_facility_id<>phc_facility_id)
);
alter table public.stockout_cases add column if not exists upstream_received_quantity numeric check (upstream_received_quantity is null or upstream_received_quantity>0);

create index if not exists stockout_cases_shc_status_created_idx on public.stockout_cases(shc_facility_id,status,created_at desc);
create index if not exists stockout_cases_phc_status_created_idx on public.stockout_cases(phc_facility_id,status,created_at desc);
create index if not exists stockout_cases_worker_created_idx on public.stockout_cases(submitted_by_worker_id,created_at desc);

create table if not exists public.stockout_case_events (
  id uuid primary key default gen_random_uuid(),
  stockout_case_id uuid not null references public.stockout_cases(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text, action text not null, status_from text, status_to text,
  note text, external_reference text, quantity numeric check (quantity is null or quantity>=0),
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists stockout_case_events_case_created_idx on public.stockout_case_events(stockout_case_id,created_at);

create or replace function app_private.guard_stockout_case_transition()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_role text:=app_private.current_profile_role(); v_worker_id uuid:=app_private.auth_worker_id(); v_allowed boolean:=false;
begin
  if tg_op='INSERT' then
    if v_role<>'worker' or v_worker_id is null or new.submitted_by_worker_id<>v_worker_id
       or not app_private.has_facility_access(new.shc_facility_id,array['worker']::text[]) then
      raise exception 'Only an assigned SHC worker can create a stockout case';
    end if;
    if not exists(select 1 from public.workers w where w.id=v_worker_id and w.facility_id=new.shc_facility_id and w.is_active) then
      raise exception 'Submitting worker must belong to the SHC';
    end if;
    if not exists(select 1 from public.facility_service_links l where l.shc_facility_id=new.shc_facility_id
      and l.phc_facility_id=new.phc_facility_id and l.verification_status='verified'
      and (l.effective_from is null or l.effective_from<=current_date)
      and (l.effective_until is null or l.effective_until>=current_date) and l.data_mode=new.data_mode) then
      raise exception 'A current verified SHC-to-PHC relationship is required';
    end if;
    if new.status not in ('draft','submitted_to_phc') then raise exception 'New case must begin as draft or submission'; end if;
    new.updated_at:=now(); return new;
  end if;

  if new.shc_facility_id is distinct from old.shc_facility_id
    or new.phc_facility_id is distinct from old.phc_facility_id
    or new.submitted_by_worker_id is distinct from old.submitted_by_worker_id
    or new.medicine_name is distinct from old.medicine_name
    or new.medicine_source_reference is distinct from old.medicine_source_reference
    or new.reported_quantity is distinct from old.reported_quantity
    or new.requested_quantity is distinct from old.requested_quantity
    or new.quantity_unit is distinct from old.quantity_unit
    or new.observation_source is distinct from old.observation_source
    or new.observed_at is distinct from old.observed_at
    or new.data_mode is distinct from old.data_mode
    or new.created_at is distinct from old.created_at then
    raise exception 'Case identity and original observation fields are immutable';
  end if;

  -- Enforce field ownership as well as transition ownership. Column grants are
  -- shared by authenticated users, so the trigger must prevent cross-role edits.
  if v_role='worker' then
    if new.phc_review_note is distinct from old.phc_review_note
      or new.phc_available_quantity is distinct from old.phc_available_quantity
      or new.official_system_name is distinct from old.official_system_name
      or new.official_indent_reference is distinct from old.official_indent_reference
      or new.official_indent_submitted_at is distinct from old.official_indent_submitted_at
      or new.upstream_receipt_reference is distinct from old.upstream_receipt_reference
      or new.upstream_received_at is distinct from old.upstream_received_at
      or new.phc_handover_quantity is distinct from old.phc_handover_quantity
      or new.phc_handover_reference is distinct from old.phc_handover_reference
      or new.phc_handover_at is distinct from old.phc_handover_at then
      raise exception 'Worker cannot edit PHC review, official indent, upstream receipt or PHC handover fields';
    end if;
    if old.status not in ('draft','clarification_requested') and new.worker_note is distinct from old.worker_note then
      raise exception 'Worker note is immutable after submission';
    end if;
  elsif v_role='supervisor' then
    if new.worker_note is distinct from old.worker_note
      or new.official_system_name is distinct from old.official_system_name
      or new.official_indent_reference is distinct from old.official_indent_reference
      or new.official_indent_submitted_at is distinct from old.official_indent_submitted_at
      or new.upstream_receipt_reference is distinct from old.upstream_receipt_reference
      or new.upstream_received_at is distinct from old.upstream_received_at
      or new.phc_handover_quantity is distinct from old.phc_handover_quantity
      or new.phc_handover_reference is distinct from old.phc_handover_reference
      or new.phc_handover_at is distinct from old.phc_handover_at
      or new.shc_collection_reference is distinct from old.shc_collection_reference
      or new.shc_collected_at is distinct from old.shc_collected_at
      or new.shc_received_quantity is distinct from old.shc_received_quantity
      or new.shc_receipt_reference is distinct from old.shc_receipt_reference
      or new.shc_received_at is distinct from old.shc_received_at
      or new.discrepancy_note is distinct from old.discrepancy_note then
      raise exception 'Supervisor cannot edit worker, storekeeper or SHC receipt fields';
    end if;
  elsif v_role='storekeeper' then
    if new.worker_note is distinct from old.worker_note
      or new.phc_review_note is distinct from old.phc_review_note
      or new.phc_available_quantity is distinct from old.phc_available_quantity
      or new.shc_collection_reference is distinct from old.shc_collection_reference
      or new.shc_collected_at is distinct from old.shc_collected_at
      or new.shc_received_quantity is distinct from old.shc_received_quantity
      or new.shc_receipt_reference is distinct from old.shc_receipt_reference
      or new.shc_received_at is distinct from old.shc_received_at
      or new.discrepancy_note is distinct from old.discrepancy_note then
      raise exception 'Storekeeper cannot edit worker, supervisor review or SHC receipt fields';
    end if;
  end if;

  if v_role='worker' and new.submitted_by_worker_id=v_worker_id
     and app_private.has_facility_access(old.shc_facility_id,array['worker']::text[]) then
    v_allowed:=((old.status='draft' and new.status in ('draft','submitted_to_phc'))
      or (old.status='clarification_requested' and new.status='resubmitted')
      or (old.status='phc_handover_recorded' and new.status='collected_by_shc')
      or (old.status='collected_by_shc' and new.status in ('partially_received_at_shc','received_at_shc'))
      or (old.status='partially_received_at_shc' and new.status in ('partially_received_at_shc','received_at_shc')));
  elsif v_role='supervisor' and app_private.has_facility_access(old.phc_facility_id,array['supervisor']::text[]) then
    v_allowed:=(old.status in ('submitted_to_phc','resubmitted','acknowledged_by_phc','under_phc_review')
      and new.status in ('acknowledged_by_phc','under_phc_review','clarification_requested','accepted_for_phc_action','phc_cannot_fulfil'));
  elsif v_role='storekeeper' and app_private.has_facility_access(old.phc_facility_id,array['storekeeper']::text[]) then
    v_allowed:=((old.status='accepted_for_phc_action' and new.status='phc_handover_recorded')
      or (old.status='phc_cannot_fulfil' and new.status='official_indent_submitted')
      or (old.status='official_indent_submitted' and new.status='upstream_supply_received_at_phc')
      or (old.status='upstream_supply_received_at_phc' and new.status='phc_handover_recorded'));
  end if;
  if not v_allowed then raise exception 'Transition is not allowed for the assigned role'; end if;

  if new.status='accepted_for_phc_action' and (new.phc_available_quantity is null or new.phc_available_quantity<=0) then raise exception 'PHC acceptance requires a positive observed available quantity'; end if;
  if new.status='phc_cannot_fulfil' and new.phc_available_quantity is distinct from 0 then raise exception 'PHC non-fulfilment must record zero observed available quantity'; end if;
  if new.status='clarification_requested' and nullif(btrim(new.phc_review_note),'') is null then raise exception 'Clarification reason required'; end if;
  if new.status='phc_cannot_fulfil' and nullif(btrim(new.phc_review_note),'') is null then raise exception 'PHC non-fulfilment reason required'; end if;
  if new.status='official_indent_submitted' and (nullif(btrim(new.official_system_name),'') is null or nullif(btrim(new.official_indent_reference),'') is null or new.official_indent_submitted_at is null) then
    raise exception 'Official system name, external reference and submission time required';
  end if;
  if new.status='upstream_supply_received_at_phc' and (nullif(btrim(new.upstream_receipt_reference),'') is null or new.upstream_received_at is null) then
    raise exception 'Upstream PHC receipt reference and time required';
  end if;
  if new.status='phc_handover_recorded' and (new.phc_handover_quantity is null or new.phc_handover_quantity<=0 or nullif(btrim(new.phc_handover_reference),'') is null or new.phc_handover_at is null) then
    raise exception 'PHC handover quantity, reference and time required';
  end if;
  if new.status='collected_by_shc' and (nullif(btrim(new.shc_collection_reference),'') is null or new.shc_collected_at is null) then
    raise exception 'SHC collection reference and time required';
  end if;
  if new.status in ('partially_received_at_shc','received_at_shc') and (new.shc_received_quantity<=old.shc_received_quantity or nullif(btrim(new.shc_receipt_reference),'') is null or new.shc_received_at is null) then
    raise exception 'SHC receipt quantity, reference and time required';
  end if;
  if new.status='received_at_shc' and (new.phc_handover_quantity is null or new.shc_received_quantity<>new.phc_handover_quantity) then
    raise exception 'Final SHC receipt requires the full PHC handover quantity';
  end if;
  if new.status='partially_received_at_shc' and (new.phc_handover_quantity is null or new.shc_received_quantity>=new.phc_handover_quantity) then
    raise exception 'Use final receipt status when full handover quantity is received';
  end if;
  new.updated_at:=now(); return new;
end; $$;

create or replace function app_private.record_stockout_case_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_action text; v_from text; v_ref text; v_qty numeric; v_note text;
begin
  if tg_op='INSERT' then v_action:=case when new.status='draft' then 'worker_draft_created' else 'worker_submitted_to_phc' end; v_from:=null;
  else
    v_action:=case new.status
      when 'submitted_to_phc' then 'worker_submitted_to_phc' when 'acknowledged_by_phc' then 'phc_acknowledged'
      when 'under_phc_review' then 'phc_review_started' when 'clarification_requested' then 'phc_clarification_requested'
      when 'resubmitted' then 'worker_resubmitted' when 'accepted_for_phc_action' then 'phc_accepted_for_action'
      when 'phc_cannot_fulfil' then 'phc_marked_unavailable' when 'official_indent_submitted' then 'official_indent_reference_recorded'
      when 'upstream_supply_received_at_phc' then 'upstream_supply_receipt_recorded' when 'phc_handover_recorded' then 'phc_handover_recorded'
      when 'collected_by_shc' then 'shc_collection_recorded' when 'partially_received_at_shc' then 'shc_partial_receipt_recorded'
      when 'received_at_shc' then 'shc_receipt_completed' when 'closed' then 'case_closed' when 'cancelled' then 'case_cancelled'
      else 'stockout_case_updated' end; v_from:=old.status;
  end if;
  v_ref:=coalesce(new.official_indent_reference,new.upstream_receipt_reference,new.phc_handover_reference,new.shc_collection_reference,new.shc_receipt_reference);
  v_qty:=case when new.status in ('partially_received_at_shc','received_at_shc') then new.shc_received_quantity when new.status='phc_handover_recorded' then new.phc_handover_quantity when new.status='upstream_supply_received_at_phc' then new.upstream_received_quantity else null end;
  v_note:=coalesce(new.phc_review_note,new.discrepancy_note,new.worker_note);
  insert into public.stockout_case_events(stockout_case_id,actor_user_id,actor_role,action,status_from,status_to,note,external_reference,quantity,metadata)
  values(new.id,auth.uid(),app_private.current_profile_role(),v_action,v_from,new.status,v_note,v_ref,v_qty,jsonb_build_object('data_mode',new.data_mode));
  return new;
end; $$;

create or replace function app_private.prevent_stockout_event_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'Stockout case event history is append-only'; end; $$;

drop trigger if exists stockout_cases_transition_guard on public.stockout_cases;
create trigger stockout_cases_transition_guard before insert or update on public.stockout_cases for each row execute function app_private.guard_stockout_case_transition();
drop trigger if exists stockout_cases_record_event on public.stockout_cases;
create trigger stockout_cases_record_event after insert or update of status on public.stockout_cases for each row execute function app_private.record_stockout_case_event();
drop trigger if exists stockout_case_events_no_update_delete on public.stockout_case_events;
create trigger stockout_case_events_no_update_delete before update or delete on public.stockout_case_events for each row execute function app_private.prevent_stockout_event_mutation();

revoke all on public.facility_service_links,public.stockout_cases,public.stockout_case_events from anon,authenticated;
grant select on public.facility_service_links,public.stockout_cases,public.stockout_case_events to authenticated;
grant insert (shc_facility_id,phc_facility_id,submitted_by_worker_id,medicine_name,medicine_source_reference,reported_quantity,requested_quantity,quantity_unit,observation_source,observed_at,worker_note,status,data_mode) on public.stockout_cases to authenticated;
grant update (status,phc_review_note,phc_available_quantity,upstream_received_quantity,official_system_name,official_indent_reference,official_indent_submitted_at,upstream_receipt_reference,upstream_received_at,phc_handover_quantity,phc_handover_reference,phc_handover_at,shc_collection_reference,shc_collected_at,shc_received_quantity,shc_receipt_reference,shc_received_at,discrepancy_note) on public.stockout_cases to authenticated;
grant all on public.facility_service_links,public.stockout_cases,public.stockout_case_events to service_role;

alter table public.facility_service_links enable row level security;
alter table public.stockout_cases enable row level security;
alter table public.stockout_case_events enable row level security;

create policy facility_service_links_scoped_read on public.facility_service_links for select to authenticated
using (app_private.has_facility_access(shc_facility_id,null) or app_private.has_facility_access(phc_facility_id,null));
create policy stockout_cases_scoped_read on public.stockout_cases for select to authenticated
using ((submitted_by_worker_id=app_private.auth_worker_id() and app_private.has_facility_access(shc_facility_id,array['worker']::text[]))
  or app_private.has_facility_access(phc_facility_id,array['supervisor','storekeeper']::text[]));
create policy stockout_cases_worker_insert on public.stockout_cases for insert to authenticated
with check (app_private.current_profile_role()='worker' and submitted_by_worker_id=app_private.auth_worker_id()
  and app_private.has_facility_access(shc_facility_id,array['worker']::text[]));
create policy stockout_cases_worker_update on public.stockout_cases for update to authenticated
using (submitted_by_worker_id=app_private.auth_worker_id() and app_private.has_facility_access(shc_facility_id,array['worker']::text[])
  and status in ('draft','clarification_requested','phc_handover_recorded','collected_by_shc','partially_received_at_shc'))
with check (submitted_by_worker_id=app_private.auth_worker_id() and app_private.has_facility_access(shc_facility_id,array['worker']::text[]));
create policy stockout_cases_phc_update on public.stockout_cases for update to authenticated
using (app_private.has_facility_access(phc_facility_id,array['supervisor','storekeeper']::text[]))
with check (app_private.has_facility_access(phc_facility_id,array['supervisor','storekeeper']::text[]));
create policy stockout_case_events_scoped_read on public.stockout_case_events for select to authenticated
using (exists(select 1 from public.stockout_cases c where c.id=stockout_case_id));

revoke all on function app_private.guard_facility_service_link() from public,anon,authenticated;
revoke all on function app_private.guard_stockout_case_transition() from public,anon,authenticated;
revoke all on function app_private.record_stockout_case_event() from public,anon,authenticated;
revoke all on function app_private.prevent_stockout_event_mutation() from public,anon,authenticated;
commit;
