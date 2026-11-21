-- Part 2H.12: prevent workers from spoofing storekeeper/facility inventory counts.
-- A snapshot's source is a trust boundary: it must agree with the authenticated
-- profile role and the actor identity represented by observed_by.
begin;

drop policy if exists inventory_snapshots_worker_insert on public.inventory_snapshots;

create policy inventory_snapshots_role_source_insert
  on public.inventory_snapshots
  for insert to authenticated
  with check (
    (
      source = 'worker_report'
      and observed_by = app_private.auth_worker_id()
      and app_private.current_profile_role() = 'worker'
      and app_private.has_facility_access(
        (select ii.facility_id from public.inventory_items ii where ii.id = inventory_item_id),
        array['worker']::text[]
      )
    )
    or
    (
      source in ('facility_count','storekeeper_count')
      and observed_by is null
      and app_private.current_profile_role() = 'storekeeper'
      and app_private.has_facility_access(
        (select ii.facility_id from public.inventory_items ii where ii.id = inventory_item_id),
        array['storekeeper']::text[]
      )
    )
  );

comment on policy inventory_snapshots_role_source_insert on public.inventory_snapshots is
  'Enforces role/source alignment: workers may submit only their own worker_report observations; assigned storekeepers may submit facility/storekeeper counts without impersonating a worker.';

commit;
