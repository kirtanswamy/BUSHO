-- Preserve action-specific evidence in the append-only stockout event stream.
-- A later SHC receipt must not inherit an earlier PHC indent reference.
begin;

create or replace function app_private.record_stockout_case_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
  v_from text;
  v_ref text;
  v_qty numeric;
  v_note text;
begin
  if tg_op = 'INSERT' then
    v_action := case when new.status = 'draft' then 'worker_draft_created' else 'worker_submitted_to_phc' end;
    v_from := null;
    v_ref := null;
    v_qty := null;
    v_note := new.worker_note;
  else
    v_action := case
      when new.status = old.status
        and (new.phc_available_quantity is distinct from old.phc_available_quantity
          or new.phc_available_observed_at is distinct from old.phc_available_observed_at)
        then 'phc_availability_observed'
      when new.status = 'submitted_to_phc' then 'worker_submitted_to_phc'
      when new.status = 'acknowledged_by_phc' then 'phc_acknowledged'
      when new.status = 'under_phc_review' then 'phc_review_started'
      when new.status = 'clarification_requested' then 'phc_clarification_requested'
      when new.status = 'resubmitted' then 'worker_resubmitted'
      when new.status = 'accepted_for_phc_action' then 'phc_accepted_for_action'
      when new.status = 'phc_cannot_fulfil' then 'phc_marked_unavailable'
      when new.status = 'official_indent_submitted' then 'official_indent_reference_recorded'
      when new.status = 'upstream_supply_received_at_phc' then 'upstream_supply_receipt_recorded'
      when new.status = 'phc_handover_recorded' then 'phc_handover_recorded'
      when new.status = 'collected_by_shc' then 'shc_collection_recorded'
      when new.status = 'partially_received_at_shc' then 'shc_partial_receipt_recorded'
      when new.status = 'discrepancy_recorded' then 'shc_discrepancy_recorded'
      when new.status = 'received_at_shc' then 'shc_receipt_completed'
      when new.status = 'closed' then 'case_closed'
      when new.status = 'cancelled' then 'case_cancelled'
      else 'stockout_case_updated'
    end;
    v_from := old.status;

    -- Store only the reference created/confirmed by this particular action.
    v_ref := case
      when new.status = 'official_indent_submitted' then new.official_indent_reference
      when new.status = 'upstream_supply_received_at_phc' then new.upstream_receipt_reference
      when new.status = 'phc_handover_recorded' then new.phc_handover_reference
      when new.status = 'collected_by_shc' then new.shc_collection_reference
      when new.status in ('partially_received_at_shc', 'discrepancy_recorded', 'received_at_shc')
        then new.shc_receipt_reference
      else null
    end;

    v_qty := case
      when new.status in ('partially_received_at_shc', 'discrepancy_recorded', 'received_at_shc')
        then new.shc_received_quantity
      when new.status = 'phc_handover_recorded' then new.phc_handover_quantity
      when new.status = 'upstream_supply_received_at_phc' then new.upstream_received_quantity
      when new.status = old.status and new.phc_available_quantity is distinct from old.phc_available_quantity
        then new.phc_available_quantity
      else null
    end;

    v_note := case
      when new.status = 'discrepancy_recorded' then new.discrepancy_note
      when new.status = 'closed' then new.closure_note
      when new.status in ('clarification_requested', 'phc_cannot_fulfil') then new.phc_review_note
      else coalesce(new.phc_review_note, new.worker_note)
    end;
  end if;

  insert into public.stockout_case_events (
    stockout_case_id, actor_user_id, actor_role, action, status_from, status_to,
    note, external_reference, quantity, metadata
  )
  values (
    new.id, auth.uid(), app_private.current_profile_role(), v_action, v_from, new.status,
    v_note, v_ref, v_qty, jsonb_build_object('data_mode', new.data_mode)
  );

  return new;
end;
$$;

commit;
