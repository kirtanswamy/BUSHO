-- Prevent overlapping verified parent-PHC assignments for a single SHC.
-- NULL effective dates are unbounded; date intervals are inclusive.

begin;

create extension if not exists btree_gist;

alter table public.facility_service_links
  add constraint facility_service_links_verified_parent_no_overlap
  exclude using gist (
    shc_facility_id with =,
    daterange(effective_from, effective_until, '[]') with &&
  )
  where (verification_status = 'verified');

commit;
