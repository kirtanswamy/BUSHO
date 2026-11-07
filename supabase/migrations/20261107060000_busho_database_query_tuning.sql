-- BUSHO query/index tuning after the operational security foundation.
-- Additive: no operational rows are rewritten or deleted.
begin;

-- Merge worker and supervisor UPDATE rules into one policy. The OR branches
-- preserve the distinct role and status restrictions while avoiding duplicate
-- permissive policy evaluation for the same authenticated UPDATE query.
drop policy if exists reports_worker_update on public.reports;
drop policy if exists reports_supervisor_update on public.reports;
create policy reports_scoped_update on public.reports
for update to authenticated
using (
  (
    app_private.current_profile_role() = 'worker'
    and worker_id = app_private.auth_worker_id()
    and status in ('draft','correction_requested')
    and app_private.has_facility_access(facility_id, array['worker']::text[])
  )
  or
  (
    app_private.current_profile_role() = 'supervisor'
    and app_private.has_facility_access(facility_id, array['supervisor']::text[])
    and status in ('submitted','resubmitted','supervisor_verified','escalated')
  )
)
with check (
  (
    app_private.current_profile_role() = 'worker'
    and worker_id = app_private.auth_worker_id()
    and status in ('draft','submitted','resubmitted','correction_requested')
    and app_private.has_facility_access(facility_id, array['worker']::text[])
  )
  or
  (
    app_private.current_profile_role() = 'supervisor'
    and app_private.has_facility_access(facility_id, array['supervisor']::text[])
    and status in ('submitted','resubmitted','supervisor_verified','correction_requested','escalated','rejected','closed')
  )
);

-- Merge worker tracking and operations-scope visibility into one SELECT policy.
drop policy if exists replenishment_requests_scoped_select on public.replenishment_requests;
drop policy if exists replenishment_requests_worker_select on public.replenishment_requests;
create policy replenishment_requests_scoped_select on public.replenishment_requests
for select to authenticated
using (
  app_private.has_facility_access(
    facility_id,
    array['supervisor','storekeeper','district_admin','state_admin']::text[]
  )
  or
  (
    app_private.current_profile_role() = 'worker'
    and app_private.has_facility_access(facility_id, array['worker']::text[])
    and source_report_id is not null
    and exists (
      select 1
      from public.reports r
      where r.id = source_report_id
        and r.facility_id = public.replenishment_requests.facility_id
        and r.worker_id = app_private.auth_worker_id()
    )
  )
);

-- Keep the pre-existing legacy index and remove the identical index introduced
-- by the foundation migration.
drop index if exists public.inventory_snapshots_item_observed_idx;

-- Foreign-key indexes for join/delete/update paths not already covered by an
-- index whose leading column matches the foreign-key column.
create index if not exists ai_runs_message_id_idx
  on public.ai_runs(message_id);
create index if not exists ai_runs_report_id_idx
  on public.ai_runs(report_id);
create index if not exists audit_logs_actor_worker_id_idx
  on public.audit_logs(actor_worker_id);
create index if not exists block_mapping_candidates_district_idx
  on public.block_mapping_candidates(district_lgd_code);
create index if not exists blocks_district_idx
  on public.blocks(district_lgd_code);
create index if not exists blocks_state_idx
  on public.blocks(state_lgd_code);
create index if not exists districts_state_idx
  on public.districts(state_lgd_code);
create index if not exists facilities_state_idx
  on public.facilities(state_lgd_code);
create index if not exists janaushadhi_district_snapshots_district_idx
  on public.janaushadhi_district_snapshots(district_lgd_code);
create index if not exists janaushadhi_district_snapshots_state_idx
  on public.janaushadhi_district_snapshots(state_lgd_code);
create index if not exists janaushadhi_kendras_block_idx
  on public.janaushadhi_kendras(block_lgd_code);
create index if not exists janaushadhi_kendras_district_idx
  on public.janaushadhi_kendras(district_lgd_code);
create index if not exists janaushadhi_state_snapshots_state_idx
  on public.janaushadhi_state_snapshots(state_lgd_code);
create index if not exists report_items_report_id_idx
  on public.report_items(report_id);
create index if not exists replenishment_requests_created_by_worker_idx
  on public.replenishment_requests(created_by);
create index if not exists replenishment_requests_created_by_user_idx
  on public.replenishment_requests(created_by_user_id);
create index if not exists replenishment_requests_inventory_item_idx
  on public.replenishment_requests(inventory_item_id);
create index if not exists replenishment_requests_reviewed_by_worker_idx
  on public.replenishment_requests(reviewed_by);
create index if not exists replenishment_requests_reviewed_by_user_idx
  on public.replenishment_requests(reviewed_by_user_id);
create index if not exists reports_conversation_idx
  on public.reports(conversation_id);
create index if not exists reports_reviewed_by_user_idx
  on public.reports(reviewed_by_user_id);
create index if not exists reports_source_message_idx
  on public.reports(source_message_id);
create index if not exists user_facility_assignments_facility_idx
  on public.user_facility_assignments(facility_id);
create index if not exists user_scope_assignments_block_idx
  on public.user_scope_assignments(block_lgd_code);
create index if not exists user_scope_assignments_district_idx
  on public.user_scope_assignments(district_lgd_code);
create index if not exists user_scope_assignments_state_idx
  on public.user_scope_assignments(state_lgd_code);

commit;
