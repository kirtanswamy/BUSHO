-- BUSHO SHC-to-PHC workflow completion: medicine strength/form, discrepancy and closure.
begin;
alter table public.stockout_cases
  add column if not exists medicine_strength_form text not null default 'Unspecified',
  add column if not exists closure_note text;
alter table public.stockout_cases drop constraint if exists stockout_cases_status_check;
alter table public.stockout_cases add constraint stockout_cases_status_check check (status in (
  'draft','submitted_to_phc','acknowledged_by_phc','under_phc_review','clarification_requested','resubmitted',
  'accepted_for_phc_action','phc_cannot_fulfil','official_indent_submitted','upstream_supply_received_at_phc',
  'phc_handover_recorded','collected_by_shc','partially_received_at_shc','discrepancy_recorded',
  'received_at_shc','closed','cancelled'));
alter table public.stockout_cases add constraint stockout_cases_medicine_strength_form_nonempty
  check (nullif(btrim(medicine_strength_form),'') is not null);
grant insert (medicine_strength_form) on public.stockout_cases to authenticated;
grant update (closure_note) on public.stockout_cases to authenticated;
drop policy if exists stockout_cases_worker_update on public.stockout_cases;
create policy stockout_cases_worker_update on public.stockout_cases for update to authenticated
using (submitted_by_worker_id=app_private.auth_worker_id()
  and app_private.has_facility_access(shc_facility_id,array['worker']::text[])
  and status in ('draft','clarification_requested','phc_handover_recorded','collected_by_shc','partially_received_at_shc','discrepancy_recorded'))
with check (submitted_by_worker_id=app_private.auth_worker_id()
  and app_private.has_facility_access(shc_facility_id,array['worker']::text[]));
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
    or new.medicine_strength_form is distinct from old.medicine_strength_form
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
      or new.phc_available_observed_at is distinct from old.phc_available_observed_at
      or new.official_system_name is distinct from old.official_system_name
      or new.official_indent_reference is distinct from old.official_indent_reference
      or new.official_indent_submitted_at is distinct from old.official_indent_submitted_at
      or new.upstream_receipt_reference is distinct from old.upstream_receipt_reference
      or new.upstream_received_at is distinct from old.upstream_received_at
      or new.upstream_received_quantity is distinct from old.upstream_received_quantity
      or new.phc_handover_quantity is distinct from old.phc_handover_quantity
      or new.phc_handover_reference is distinct from old.phc_handover_reference
      or new.phc_handover_at is distinct from old.phc_handover_at
      or new.closure_note is distinct from old.closure_note then
      raise exception 'Worker cannot edit PHC review, official indent, upstream receipt or PHC handover fields';
    end if;
    if old.status not in ('draft','clarification_requested') and new.worker_note is distinct from old.worker_note then
      raise exception 'Worker note is immutable after submission';
    end if;
  elsif v_role='supervisor' then
    if new.worker_note is distinct from old.worker_note
      or new.phc_available_quantity is distinct from old.phc_available_quantity
      or new.phc_available_observed_at is distinct from old.phc_available_observed_at
      or new.official_system_name is distinct from old.official_system_name
      or new.official_indent_reference is distinct from old.official_indent_reference
      or new.official_indent_submitted_at is distinct from old.official_indent_submitted_at
      or new.upstream_receipt_reference is distinct from old.upstream_receipt_reference
      or new.upstream_received_at is distinct from old.upstream_received_at
      or new.upstream_received_quantity is distinct from old.upstream_received_quantity
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
      or new.shc_collection_reference is distinct from old.shc_collection_reference
      or new.shc_collected_at is distinct from old.shc_collected_at
      or new.shc_received_quantity is distinct from old.shc_received_quantity
      or new.shc_receipt_reference is distinct from old.shc_receipt_reference
      or new.shc_received_at is distinct from old.shc_received_at
      or new.discrepancy_note is distinct from old.discrepancy_note
      or new.closure_note is distinct from old.closure_note then
      raise exception 'Storekeeper cannot edit worker, supervisor review or SHC receipt fields';
    end if;
  end if;

  if v_role='worker' and new.submitted_by_worker_id=v_worker_id
     and app_private.has_facility_access(old.shc_facility_id,array['worker']::text[]) then
    v_allowed:=((old.status='draft' and new.status in ('draft','submitted_to_phc'))
      or (old.status='clarification_requested' and new.status='resubmitted')
      or (old.status='phc_handover_recorded' and new.status='collected_by_shc')
      or (old.status='collected_by_shc' and new.status in ('partially_received_at_shc','received_at_shc','discrepancy_recorded'))
      or (old.status='partially_received_at_shc' and new.status in ('partially_received_at_shc','received_at_shc','discrepancy_recorded'))
      or (old.status='discrepancy_recorded' and new.status in ('partially_received_at_shc','received_at_shc')));
  elsif v_role='supervisor' and app_private.has_facility_access(old.phc_facility_id,array['supervisor']::text[]) then
    v_allowed:=((old.status in ('submitted_to_phc','resubmitted','acknowledged_by_phc','under_phc_review')
      and new.status in ('acknowledged_by_phc','under_phc_review','clarification_requested','accepted_for_phc_action','phc_cannot_fulfil'))
      or (old.status='accepted_for_phc_action' and new.status='phc_cannot_fulfil')
      or (old.status in ('received_at_shc','discrepancy_recorded') and new.status='closed'));
  elsif v_role='storekeeper' and app_private.has_facility_access(old.phc_facility_id,array['storekeeper']::text[]) then
    v_allowed:=((old.status='accepted_for_phc_action' and new.status='accepted_for_phc_action'
        and (new.phc_available_quantity is distinct from old.phc_available_quantity
          or new.phc_available_observed_at is distinct from old.phc_available_observed_at))
      or (old.status='accepted_for_phc_action' and new.status='phc_handover_recorded')
      or (old.status='phc_cannot_fulfil' and new.status='official_indent_submitted')
      or (old.status='official_indent_submitted' and new.status='upstream_supply_received_at_phc')
      or (old.status='upstream_supply_received_at_phc' and new.status='phc_handover_recorded'));
  end if;
  if not v_allowed then raise exception 'Transition is not allowed for the assigned role'; end if;

  if new.phc_available_quantity is distinct from old.phc_available_quantity
     and (v_role<>'storekeeper' or new.phc_available_quantity<0 or new.phc_available_observed_at is null) then
    raise exception 'Only the assigned PHC storekeeper can record a non-negative physical availability observation with a timestamp';
  end if;
  if new.phc_available_observed_at is distinct from old.phc_available_observed_at
     and (v_role<>'storekeeper' or new.phc_available_observed_at is null) then
    raise exception 'Only the assigned PHC storekeeper can timestamp a physical availability observation';
  end if;
  if new.status='phc_cannot_fulfil' and (new.phc_available_quantity is distinct from 0 or new.phc_available_observed_at is null) then
    raise exception 'PHC non-fulfilment requires a storekeeper-recorded zero availability observation';
  end if;
  if new.status='clarification_requested' and nullif(btrim(new.phc_review_note),'') is null then raise exception 'Clarification reason required'; end if;
  if new.status='phc_cannot_fulfil' and nullif(btrim(new.phc_review_note),'') is null then raise exception 'PHC non-fulfilment reason required'; end if;
  if new.status='official_indent_submitted' and (nullif(btrim(new.official_system_name),'') is null or nullif(btrim(new.official_indent_reference),'') is null or new.official_indent_submitted_at is null) then
    raise exception 'Official system name, external reference and submission time required';
  end if;
  if new.status='upstream_supply_received_at_phc' and (nullif(btrim(new.upstream_receipt_reference),'') is null or new.upstream_received_at is null or new.upstream_received_quantity is null or new.upstream_received_quantity<=0) then
    raise exception 'Upstream PHC receipt quantity, reference and time required';
  end if;
  if new.status='phc_handover_recorded' and (
    (new.upstream_received_quantity is not null and new.phc_handover_quantity>new.upstream_received_quantity)
    or (new.upstream_received_quantity is null and (
      new.phc_available_quantity is null or new.phc_available_observed_at is null
      or new.phc_handover_quantity>new.phc_available_quantity))
  ) then
    raise exception 'PHC handover must be supported by a current physical availability observation or upstream PHC receipt';
  end if;
  if new.phc_handover_quantity > new.requested_quantity then
    raise exception 'PHC handover cannot exceed the SHC requested quantity';
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
  if new.status='discrepancy_recorded' and (new.phc_handover_quantity is null or new.shc_received_quantity<=old.shc_received_quantity
    or new.shc_received_quantity>new.phc_handover_quantity or nullif(btrim(new.discrepancy_note),'') is null
    or nullif(btrim(new.shc_receipt_reference),'') is null or new.shc_received_at is null) then
    raise exception 'Discrepancy requires a cumulative SHC receipt, receipt reference, time and explanation';
  end if;
  if new.status='closed' and (old.status not in ('received_at_shc','discrepancy_recorded') or nullif(btrim(new.closure_note),'') is null) then
    raise exception 'Case closure requires completed receipt or recorded discrepancy and a resolution note';
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
    v_action:=case
      when new.status=old.status and (new.phc_available_quantity is distinct from old.phc_available_quantity
        or new.phc_available_observed_at is distinct from old.phc_available_observed_at) then 'phc_availability_observed'
      when new.status='submitted_to_phc' then 'worker_submitted_to_phc' when new.status='acknowledged_by_phc' then 'phc_acknowledged'
      when new.status='under_phc_review' then 'phc_review_started' when new.status='clarification_requested' then 'phc_clarification_requested'
      when new.status='resubmitted' then 'worker_resubmitted' when new.status='accepted_for_phc_action' then 'phc_accepted_for_action'
      when new.status='phc_cannot_fulfil' then 'phc_marked_unavailable' when new.status='official_indent_submitted' then 'official_indent_reference_recorded'
      when new.status='upstream_supply_received_at_phc' then 'upstream_supply_receipt_recorded' when new.status='phc_handover_recorded' then 'phc_handover_recorded'
      when new.status='collected_by_shc' then 'shc_collection_recorded' when new.status='partially_received_at_shc' then 'shc_partial_receipt_recorded'
      when new.status='received_at_shc' then 'shc_receipt_completed' when new.status='discrepancy_recorded' then 'shc_discrepancy_recorded' when new.status='closed' then 'case_closed' when new.status='cancelled' then 'case_cancelled'
      else 'stockout_case_updated' end; v_from:=old.status;
  end if;
  v_ref:=coalesce(new.official_indent_reference,new.upstream_receipt_reference,new.phc_handover_reference,new.shc_collection_reference,new.shc_receipt_reference);
  v_qty:=case when new.status in ('partially_received_at_shc','received_at_shc') then new.shc_received_quantity when new.status='phc_handover_recorded' then new.phc_handover_quantity when new.status='upstream_supply_received_at_phc' then new.upstream_received_quantity when new.phc_available_quantity is distinct from old.phc_available_quantity then new.phc_available_quantity else null end;
  v_note:=coalesce(new.closure_note,new.phc_review_note,new.discrepancy_note,new.worker_note);
  insert into public.stockout_case_events(stockout_case_id,actor_user_id,actor_role,action,status_from,status_to,note,external_reference,quantity,metadata)
  values(new.id,auth.uid(),app_private.current_profile_role(),v_action,v_from,new.status,v_note,v_ref,v_qty,jsonb_build_object('data_mode',new.data_mode));
  return new;
end; $$;
drop trigger if exists stockout_cases_record_event on public.stockout_cases;
create trigger stockout_cases_record_event after insert or update of status,phc_available_quantity,phc_available_observed_at
  on public.stockout_cases for each row execute function app_private.record_stockout_case_event();
commit;
