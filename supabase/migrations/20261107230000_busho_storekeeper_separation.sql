-- Part 2E: separate supervisor authorization from storekeeper fulfilment.
-- Additive policy correction; preserve the original security foundation migration.
begin;

create or replace function app_private.guard_replenishment_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := app_private.current_profile_role();
  v_user uuid := auth.uid();
  v_delta numeric;
begin
  if tg_op = 'INSERT' then
    if v_role <> 'supervisor'
       or not app_private.has_facility_access(new.facility_id, array['supervisor']::text[]) then
      raise exception 'Only an assigned active supervisor can create an indent recommendation';
    end if;
    if new.source_report_id is null or not exists (
      select 1 from public.reports r
      where r.id = new.source_report_id
        and r.facility_id = new.facility_id
        and r.status in ('supervisor_verified','closed')
    ) then
      raise exception 'An associated supervisor-verified report is required';
    end if;
    new.created_by_user_id := v_user;
    if new.status not in ('draft','recommended_to_facility_store') then
      raise exception 'A new indent must begin as a draft or recommendation';
    end if;
    return new;
  end if;

  if new.facility_id is distinct from old.facility_id
     or new.inventory_item_id is distinct from old.inventory_item_id
     or new.requested_quantity is distinct from old.requested_quantity
     or new.created_at is distinct from old.created_at
     or new.source_report_id is distinct from old.source_report_id
     or new.created_by_user_id is distinct from old.created_by_user_id
     or new.reviewed_by_user_id is distinct from old.reviewed_by_user_id
     or new.reviewed_at_user is distinct from old.reviewed_at_user
     or new.data_mode is distinct from old.data_mode then
    raise exception 'Indent ownership, item, creator, reviewer, requested quantity, source report and data mode are immutable';
  end if;

  if old.dpdmis_reference is not null and new.dpdmis_reference is distinct from old.dpdmis_reference then
    raise exception 'A recorded DPDMIS reference cannot be changed';
  end if;
  if old.allocation_reference is not null and new.allocation_reference is distinct from old.allocation_reference then
    raise exception 'A recorded allocation reference cannot be changed';
  end if;
  if old.dispatch_reference is not null and new.dispatch_reference is distinct from old.dispatch_reference then
    raise exception 'A recorded dispatch reference cannot be changed';
  end if;

  if new.dpdmis_reference is distinct from old.dpdmis_reference
     and not (old.status = 'supervisor_approved' and new.status = 'submitted_to_dpdmis') then
    raise exception 'DPDMIS reference can only be recorded during submission';
  end if;
  if new.allocation_reference is distinct from old.allocation_reference
     and not (old.status = 'submitted_to_dpdmis' and new.status = 'allocated') then
    raise exception 'Allocation reference can only be recorded during allocation';
  end if;
  if new.dispatch_reference is distinct from old.dispatch_reference
     and not (old.status in ('submitted_to_dpdmis','allocated') and new.status = 'dispatched') then
    raise exception 'Dispatch reference can only be recorded during dispatch';
  end if;
  if new.receipt_reference is distinct from old.receipt_reference
     and not (
       old.status in ('dispatched','partially_received')
       and new.status in ('partially_received','received')
       and new.received_quantity > old.received_quantity
       and nullif(btrim(new.receipt_reference), '') is not null
     ) then
    raise exception 'Receipt references can only be recorded with a receipt quantity update';
  end if;

  if v_role not in ('supervisor','storekeeper')
     or not app_private.has_facility_access(old.facility_id, array['supervisor','storekeeper']::text[]) then
    raise exception 'Assigned supervisor or storekeeper role required';
  end if;

  if old.status = 'draft' and new.status = 'recommended_to_facility_store' then
    if v_role <> 'supervisor' then raise exception 'Only a supervisor can recommend an indent'; end if;
  elsif old.status = 'recommended_to_facility_store' and new.status = 'supervisor_approved' then
    if v_role <> 'supervisor' then raise exception 'Only a supervisor can approve an indent'; end if;
    new.reviewed_by_user_id := v_user;
    new.reviewed_at_user := now();
  elsif old.status in ('recommended_to_facility_store','supervisor_approved','submitted_to_dpdmis')
        and new.status = 'returned_for_clarification' then
    if nullif(btrim(new.note), '') is null then raise exception 'A clarification reason is required'; end if;
  elsif old.status = 'supervisor_approved' and new.status = 'submitted_to_dpdmis' then
    if v_role <> 'supervisor' then
      raise exception 'Only the assigned supervisor can submit an approved recommendation to DPDMIS';
    end if;
    if nullif(btrim(new.dpdmis_reference), '') is null then
      raise exception 'A DPDMIS submission reference is required';
    end if;
  elsif old.status = 'submitted_to_dpdmis' and new.status = 'allocated' then
    if v_role <> 'storekeeper' then
      raise exception 'Only an assigned storekeeper can record allocation';
    end if;
    if nullif(btrim(new.allocation_reference), '') is null then
      raise exception 'An allocation reference is required';
    end if;
  elsif old.status in ('submitted_to_dpdmis','allocated') and new.status = 'dispatched' then
    if v_role <> 'storekeeper' then
      raise exception 'Only an assigned storekeeper can record dispatch';
    end if;
    if nullif(btrim(new.dispatch_reference), '') is null then
      raise exception 'A dispatch/challan reference is required';
    end if;
  elsif old.status in ('dispatched','partially_received')
        and new.status in ('partially_received','received') then
    if v_role <> 'storekeeper' then
      raise exception 'Only an assigned storekeeper can record goods receipt';
    end if;
    if nullif(btrim(new.receipt_reference), '') is null then
      raise exception 'A goods receipt reference is required';
    end if;
    v_delta := new.received_quantity - old.received_quantity;
    if v_delta <= 0 then raise exception 'Receipt quantity must increase'; end if;
    if new.received_quantity > new.requested_quantity then
      raise exception 'Received quantity cannot exceed requested quantity';
    end if;
    if new.status = 'partially_received' and new.received_quantity >= new.requested_quantity then
      raise exception 'Use received status when the full requested quantity arrives';
    end if;
    if new.status = 'received' and new.received_quantity <> new.requested_quantity then
      raise exception 'The full requested quantity must be recorded before closing receipt';
    end if;
  else
    raise exception 'This indent transition is not allowed';
  end if;

  return new;
end;
$$;


commit;
