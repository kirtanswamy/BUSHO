begin;

create policy facilities_verified_parent_phc_select
on public.facilities
for select
to authenticated
using (
  app_private.current_profile_role() = 'worker'
  and exists (
    select 1
    from public.facility_service_links l
    where l.phc_facility_id = facilities.id
      and l.relationship_type = 'shc_reports_to_phc'
      and l.verification_status = 'verified'
      and (
        l.effective_from is null
        or l.effective_from <= (now() at time zone 'Asia/Kolkata')::date
      )
      and (
        l.effective_until is null
        or l.effective_until >= (now() at time zone 'Asia/Kolkata')::date
      )
      and app_private.has_facility_access(
        l.shc_facility_id,
        array['worker']::text[]
      )
  )
);

commit;