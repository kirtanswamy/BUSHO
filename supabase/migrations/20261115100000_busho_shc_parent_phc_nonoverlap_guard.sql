-- Prevent overlapping verified parent-PHC assignments for a single SHC.
-- NULL effective dates are unbounded; date intervals are inclusive.
begin;
create extension if not exists btree_gist;
create index if not exists facility_service_links_one_current_parent_no_overlap_gist
  on public.facility_service_links
  using gist (
    shc_facility_id,
    daterange(effective_from, effective_until, '[]')
  )
  where verification_status='verified';
commit;
