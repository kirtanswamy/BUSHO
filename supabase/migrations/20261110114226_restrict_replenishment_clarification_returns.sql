begin;

create or replace function app_private.guard_replenishment_clarification_return()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'returned_for_clarification'
     and new.status is distinct from old.status then

    if old.status = 'submitted_to_dpdmis' then
      raise exception
        'A DPDMIS-submitted request cannot be returned through the clarification workflow';
    end if;

    if app_private.current_profile_role() is distinct from 'supervisor'
       or not app_private.has_facility_access(
         new.facility_id,
         array['supervisor']::text[]
       ) then
      raise exception
        'Only an assigned active supervisor can return an indent for clarification';
    end if;

    if nullif(btrim(new.note), '') is null then
      raise exception 'A clarification reason is required';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists busho_zz_guard_replenishment_clarification
  on public.replenishment_requests;

create trigger busho_zz_guard_replenishment_clarification
before update on public.replenishment_requests
for each row
execute function app_private.guard_replenishment_clarification_return();

revoke all on function
  app_private.guard_replenishment_clarification_return()
  from public, anon, authenticated;

commit;
