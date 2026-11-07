begin;

-- Keep this migration safe on both the initial rollout and databases where
-- the policy/trigger were already introduced by the foundation migration.
drop policy if exists report_items_supervisor_update on public.report_items;
create policy report_items_supervisor_update on public.report_items
  for update to authenticated
  using (exists (
    select 1 from public.reports r
    where r.id = report_id
      and r.status in ('submitted','resubmitted')
      and app_private.current_profile_role() = 'supervisor'
      and app_private.has_facility_access(r.facility_id, array['supervisor']::text[])
  ))
  with check (exists (
    select 1 from public.reports r
    where r.id = report_id
      and r.status in ('submitted','resubmitted')
      and app_private.current_profile_role() = 'supervisor'
      and app_private.has_facility_access(r.facility_id, array['supervisor']::text[])
  ));

-- Capture structured-field correction metadata in the append-only report
-- timeline. Never duplicate the field values or original report text here.
create or replace function app_private.record_report_item_correction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fields text[] := array[]::text[];
begin
  if new.item_type is distinct from old.item_type then v_fields := array_append(v_fields, 'item_type'); end if;
  if new.item_code is distinct from old.item_code then v_fields := array_append(v_fields, 'item_code'); end if;
  if new.display_label is distinct from old.display_label then v_fields := array_append(v_fields, 'display_label'); end if;
  if new.quantity is distinct from old.quantity then v_fields := array_append(v_fields, 'quantity'); end if;
  if new.unit is distinct from old.unit then v_fields := array_append(v_fields, 'unit'); end if;
  if new.value_text is distinct from old.value_text then v_fields := array_append(v_fields, 'value_text'); end if;
  if new.confidence is distinct from old.confidence then v_fields := array_append(v_fields, 'confidence'); end if;
  if new.requires_review is distinct from old.requires_review then v_fields := array_append(v_fields, 'requires_review'); end if;
  if cardinality(v_fields) = 0 then return new; end if;

  insert into public.report_events
    (report_id, actor_user_id, actor_role, action, status_from, status_to, note, metadata)
  values (
    new.report_id, auth.uid(), app_private.current_profile_role(),
    'report_item_corrected', null, null, null,
    jsonb_build_object('report_item_id', new.id, 'changed_fields', to_jsonb(v_fields))
  );
  return new;
end;
$$;

drop trigger if exists busho_report_item_correction_event on public.report_items;
create trigger busho_report_item_correction_event after update on public.report_items
  for each row execute function app_private.record_report_item_correction();

-- This routine is trigger-only, not a callable Data API function.
revoke all on function app_private.record_report_item_correction()
  from public, anon, authenticated;

comment on function app_private.record_report_item_correction() is
  'Trigger-only metadata audit for structured report field corrections; does not store changed clinical values.';

commit;
