-- Part 2C.3: align facility taxonomy and protect unsubmitted worker drafts.
-- CI applies this migration to an isolated PostgreSQL contract database only.
-- Do not apply to the connected project without a separately approved release.

begin;

-- AAM-PHC is distinct from a generic PHC in the programme context.
alter table public.facilities
  drop constraint if exists facilities_facility_type_check;
alter table public.facilities
  add constraint facilities_facility_type_check
  check (facility_type in ('aam_shc','aam_phc','phc','chc','district_hospital','sub_centre','other'));

alter table public.facility_registry_candidates
  drop constraint if exists facility_registry_candidates_facility_type_check;
alter table public.facility_registry_candidates
  add constraint facility_registry_candidates_facility_type_check
  check (facility_type in ('aam_shc','aam_phc','phc','chc','district_hospital','sub_centre','other'));

-- Workers retain access to their own drafts. Facility supervisors and scoped
-- administrators see a report only after the worker has submitted it.
drop policy if exists reports_scoped_select on public.reports;
create policy reports_scoped_select on public.reports
  for select to authenticated
  using (
    worker_id = app_private.auth_worker_id()
    or (
      status <> 'draft'
      and app_private.has_facility_access(
        facility_id,
        array['supervisor','district_admin','state_admin']::text[]
      )
    )
  );

comment on constraint facilities_facility_type_check on public.facilities is
  'AAM-PHC is distinct from generic PHC; taxonomy does not confer role permissions.';
comment on policy reports_scoped_select on public.reports is
  'Workers can read their own reports; assigned supervisors and scoped administrators can read only submitted/non-draft reports.';

commit;
