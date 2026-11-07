-- Runs only against the disposable PostgreSQL 17 CI service.
-- Uses synthetic identities, aggregate-only reports and fake external references.

insert into auth.users (id, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', '{"full_name":"Synthetic Worker A"}'),
  ('22222222-2222-4222-8222-222222222222', '{"full_name":"Synthetic Worker B"}'),
  ('33333333-3333-4333-8333-333333333333', '{"full_name":"Synthetic Supervisor"}'),
  ('44444444-4444-4444-8444-444444444444', '{"full_name":"Synthetic State Admin"}'),
  ('55555555-5555-4555-8555-555555555555', '{"full_name":"Synthetic District Admin"}'),
  ('66666666-6666-4666-8666-666666666666', '{"full_name":"Synthetic Supervisor B"}');

update public.profiles
set role = case id
  when '11111111-1111-4111-8111-111111111111' then 'worker'
  when '22222222-2222-4222-8222-222222222222' then 'worker'
  when '33333333-3333-4333-8333-333333333333' then 'supervisor'
  when '44444444-4444-4444-8444-444444444444' then 'state_admin'
  when '55555555-5555-4555-8555-555555555555' then 'district_admin'
  when '66666666-6666-4666-8666-666666666666' then 'supervisor'
end,
status = 'active'
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666'
);

insert into public.facilities
  (id, name, district, state, state_lgd_code, district_lgd_code, block_lgd_code,
   facility_type, verification_status, is_synthetic)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Synthetic Dhamtari HWC', 'Dhamtari', 'Chhattisgarh',
   '22', '377', '3625', 'aam_shc', 'verified', true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Synthetic Balod HWC', 'Balod', 'Chhattisgarh',
   '22', '646', '3629', 'aam_shc', 'verified', true);

-- The AAM-PHC taxonomy is accepted by the database constraint, but remains
-- a synthetic CI fixture and is never seeded into a live project.
begin;
insert into public.facilities
  (id, name, district, state, state_lgd_code, district_lgd_code, block_lgd_code,
   facility_type, verification_status, is_synthetic)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Synthetic AAM PHC taxonomy fixture', 'Balod', 'Chhattisgarh',
   '22', '646', '3629', 'aam_phc', 'verified', true);
rollback;

insert into public.workers
  (id, facility_id, display_name, whatsapp_number, role, is_active, auth_user_id)
values
  ('10000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Synthetic Worker A', '+910000000001', 'worker', true, '11111111-1111-4111-8111-111111111111'),
  ('10000000-0000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'Synthetic Worker B', '+910000000002', 'worker', true, '22222222-2222-4222-8222-222222222222');

insert into public.user_facility_assignments (user_id, facility_id, assignment_role)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'worker'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'worker');

insert into public.user_scope_assignments
  (user_id, scope_level, state_lgd_code, district_lgd_code, block_lgd_code, scope_role)
values
  ('33333333-3333-4333-8333-333333333333', 'block', '22', '377', '3625', 'supervisor'),
  ('44444444-4444-4444-8444-444444444444', 'state', '22', null, null, 'state_admin'),
  ('55555555-5555-4555-8555-555555555555', 'district', '22', '377', null, 'district_admin'),
  ('66666666-6666-4666-8666-666666666666', 'block', '22', '646', '3629', 'supervisor');

insert into public.medicine_catalogue_releases
  (id, catalogue_code, catalogue_name, state_lgd_code, source_authority, source_date,
   publication_date, source_url, source_document_title, version_label, status)
values
  ('30000000-0000-4000-8000-000000000001', 'CG-EDL', 'Chhattisgarh Essential Drug List',
   '22', 'Department of Health and Family Welfare, Government of Chhattisgarh',
   '2025-11-12', '2025-11-12',
   'https://dpdmis.in/faconline/Common/Document/EDL_2025.pdf',
   'Essential Drug List - 2025', '2025', 'reference_only');

insert into public.medicine_catalogue_entries
  (id, release_id, source_annexure, facility_level, source_item_number, source_page,
   therapeutic_category_source, source_description)
values
  ('30000000-0000-4000-8000-000000000002',
   '30000000-0000-4000-8000-000000000001',
   'shc_aam', 'shc_aam', 69, 55, 'Gastrointestinal medicines', 'Oral rehydration salts (ORS)');

insert into public.inventory_items (id, facility_id, item_code, name, unit, is_active)
values
  ('20000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'ORS-PKT', 'ORS packets', 'packets', true),
  ('20000000-0000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'ORS-PKT', 'ORS packets', 'packets', true);

update public.inventory_items
set medicine_catalogue_entry_id = '30000000-0000-4000-8000-000000000002'
where id = '20000000-0000-4000-8000-000000000001';

-- Worker A can read only their assigned facility and their own worker record.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.facilities;
  if v_count <> 1 then raise exception 'Worker A facility scope leak: expected 1, got %', v_count; end if;
  select count(*) into v_count from public.workers;
  if v_count <> 1 then raise exception 'Worker A worker scope leak: expected 1, got %', v_count; end if;
  select count(*) into v_count from public.medicine_catalogue_entries
  where id = '30000000-0000-4000-8000-000000000002';
  if v_count <> 1 then raise exception 'Authenticated worker should read the reference catalogue'; end if;
  select count(*) into v_count from public.inventory_items ii
  join public.medicine_catalogue_entries me on me.id = ii.medicine_catalogue_entry_id
  where ii.id = '20000000-0000-4000-8000-000000000001';
  if v_count <> 1 then raise exception 'Facility inventory item should link to its reviewed reference entry'; end if;
end $$;

insert into public.reports
  (facility_id, worker_id, reporting_date, original_text, language_code, status, summary)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '10000000-0000-4000-8000-000000000001',
   current_date, 'worker_report_created synthetic aggregate only', 'en', 'draft', '{"source":"voice"}');

update public.reports
set summary = '{"source":"voice","fever_count":4}'
where original_text = 'worker_report_created synthetic aggregate only';

insert into public.report_items
  (report_id, item_type, item_code, display_label, quantity, unit, value_text, confidence, requires_review)
select id, 'symptom_trend', 'FEVER', 'Fever cases', 4, 'patients',
       'Four aggregate fever mentions', 0.90, true
from public.reports
where original_text = 'worker_report_created synthetic aggregate only';

update public.reports
set status = 'submitted'
where original_text = 'worker_report_created synthetic aggregate only';

-- A second, unsubmitted draft at the same facility must remain worker-private.
insert into public.reports
  (facility_id, worker_id, reporting_date, original_text, language_code, status, summary)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '10000000-0000-4000-8000-000000000001',
   current_date, 'worker_private_draft_not_for_supervisor', 'en', 'draft', '{"source":"manual"}');

do $worker_own_draft_check$
declare v_count integer;
begin
  select count(*) into v_count from public.reports
  where original_text = 'worker_private_draft_not_for_supervisor';
  if v_count <> 1 then raise exception 'Worker must retain access to their own draft'; end if;
end $worker_own_draft_check$;

-- A worker cannot self-verify a submitted report.
update public.reports
set status = 'supervisor_verified'
where original_text = 'worker_report_created synthetic aggregate only';

do $$
declare
  v_status text;
  v_events integer;
begin
  select status into v_status from public.reports
  where original_text = 'worker_report_created synthetic aggregate only';
  if v_status <> 'submitted' then raise exception 'Worker escalated own report unexpectedly: %', v_status; end if;

  select count(*) into v_events from public.report_events re
  join public.reports r on r.id = re.report_id
  where r.original_text = 'worker_report_created synthetic aggregate only';
  if v_events <> 3 then raise exception 'Expected create, field-edit and submit audit events; got %', v_events; end if;
end $$;

-- Worker stock observation is facility-scoped and attributable to the logged-in worker.
insert into public.inventory_snapshots
  (inventory_item_id, quantity, observed_by, source, data_mode)
values
  ('20000000-0000-4000-8000-000000000001', 12,
   '10000000-0000-4000-8000-000000000001', 'worker_report', 'synthetic_demo');
commit;

-- Worker B creates a report in a different district/facility.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
insert into public.reports
  (facility_id, worker_id, reporting_date, original_text, language_code, status, summary)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '10000000-0000-4000-8000-000000000002',
   current_date, 'worker_report_created synthetic second facility', 'en', 'draft', '{"source":"manual"}');
insert into public.report_items
  (report_id, item_type, item_code, display_label, quantity, unit, value_text, requires_review)
select id, 'stock_observation', 'ORS', 'ORS packets', 8, 'packets',
       'Synthetic second-facility stock observation', true
from public.reports
where original_text = 'worker_report_created synthetic second facility';

update public.reports
set status = 'submitted'
where original_text = 'worker_report_created synthetic second facility';

do $
declare v_count integer;
begin
  select count(*) into v_count from public.reports;
  if v_count <> 1 then raise exception 'Worker B must only see their own report, got %', v_count; end if;
end $$;
commit;

-- The block supervisor can review only Dhamtari's report and assigned workers.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
do $supervisor_scope_check$
declare
  v_count integer;
begin
  select count(*) into v_count from public.reports;
  if v_count <> 1 then
    raise exception 'Block supervisor report scope leak: expected 1, got %', v_count;
  end if;
  select count(*) into v_count from public.workers;
  if v_count <> 1 then
    raise exception 'Block supervisor worker scope leak: expected 1, got %', v_count;
  end if;
end $supervisor_scope_check$;

update public.report_items
set quantity = 5,
    display_label = 'Fever cases (supervisor checked)',
    requires_review = false
where report_id = (
  select id from public.reports
  where original_text = 'worker_report_created synthetic aggregate only'
)
and item_code = 'FEVER';

do $supervisor_correction_check$
declare
  v_quantity numeric;
  v_events integer;
begin
  select ri.quantity into v_quantity
  from public.report_items ri
  join public.reports r on r.id = ri.report_id
  where r.original_text = 'worker_report_created synthetic aggregate only'
    and ri.item_code = 'FEVER';
  if v_quantity <> 5 then
    raise exception 'Assigned supervisor could not correct the structured report quantity: %', v_quantity;
  end if;
  select count(*) into v_events
  from public.report_events re
  join public.reports r on r.id = re.report_id
  where r.original_text = 'worker_report_created synthetic aggregate only'
    and re.action = 'report_item_corrected';
  if v_events <> 1 then
    raise exception 'Expected one append-only structured-field correction event, got %', v_events;
  end if;
end $supervisor_correction_check$;

update public.reports
set status = 'supervisor_verified', review_note = 'Aggregate counts reviewed in synthetic CI test'
where original_text = 'worker_report_created synthetic aggregate only';

update public.reports
set summary = '{"source":"voice","fever_count":4,"reviewed":true}'
where original_text = 'worker_report_created synthetic aggregate only';

do $$
declare v_count integer;
begin
  select count(*) into v_count from public.report_events re
  join public.reports r on r.id = re.report_id
  where r.original_text = 'worker_report_created synthetic aggregate only'
    and re.action = 'report_fields_updated';
  if v_count <> 2 then raise exception 'Expected two field-edit audit events, got %', v_count; end if;
end $$;

insert into public.replenishment_requests
  (facility_id, inventory_item_id, requested_quantity, status, created_by_user_id,
   source_report_id, on_hand_quantity, unit, note, data_mode)
select
  r.facility_id,
  '20000000-0000-4000-8000-000000000001',
  20,
  'recommended_to_facility_store',
  '33333333-3333-4333-8333-333333333333',
  r.id,
  5,
  'packets',
  'Synthetic replenishment recommendation',
  'synthetic_demo'
from public.reports r
where r.original_text = 'worker_report_created synthetic aggregate only';

update public.replenishment_requests
set status = 'supervisor_approved'
where note = 'Synthetic replenishment recommendation';

update public.replenishment_requests
set status = 'submitted_to_dpdmis', dpdmis_reference = 'DPDMIS-TEST-001'
where note = 'Synthetic replenishment recommendation';

do $$
declare
  v_reviewer uuid;
  v_created uuid;
  v_status text;
begin
  select reviewed_by_user_id, created_by_user_id, status
  into v_reviewer, v_created, v_status
  from public.replenishment_requests
  where note = 'Synthetic replenishment recommendation';
  if v_reviewer <> auth.uid() then raise exception 'Supervisor approval attribution was not recorded'; end if;
  if v_created <> auth.uid() then raise exception 'Indent creator attribution was not recorded'; end if;
  if v_status <> 'submitted_to_dpdmis' then raise exception 'Unexpected indent status: %', v_status; end if;
end $$;

-- An assigned supervisor can never rewrite a submitted external-system reference.
do $$
declare v_blocked boolean := false;
begin
  begin
    update public.replenishment_requests
    set dpdmis_reference = 'DPDMIS-OVERWRITTEN'
    where note = 'Synthetic replenishment recommendation';
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then raise exception 'A recorded DPDMIS reference was mutable'; end if;
end $$;
commit;

-- Worker A can track the indent generated from their own reviewed report.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$
declare v_count integer; v_status text;
begin
  select count(*) into v_count from public.replenishment_requests;
  if v_count <> 1 then raise exception 'Worker A cannot see their own replenishment status'; end if;
  select status into v_status from public.replenishment_requests;
  if v_status <> 'submitted_to_dpdmis' then raise exception 'Worker sees wrong indent status: %', v_status; end if;
  select count(*) into v_count from public.replenishment_events;
  if v_count < 3 then raise exception 'Worker should see append-only indent events, got %', v_count; end if;
end $$;
commit;

-- Worker B must not see another facility's indent.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
do $$
declare v_count integer;
begin
  select count(*) into v_count from public.replenishment_requests;
  if v_count <> 0 then raise exception 'Worker B can see another worker facility indent'; end if;
end $$;
commit;

-- Supervisor B is assigned only to Balod. They can review Worker B's report,
-- but cannot see or mutate Worker A's Dhamtari report.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
do $supervisor_b_scope_check$
declare
  v_count integer;
  v_updated integer;
begin
  select count(*) into v_count from public.reports;
  if v_count <> 1 then
    raise exception 'Supervisor B report scope leak: expected 1, got %', v_count;
  end if;
  select count(*) into v_count from public.reports
  where original_text = 'worker_report_created synthetic second facility';
  if v_count <> 1 then
    raise exception 'Supervisor B must see Worker B report only; got %', v_count;
  end if;
  select count(*) into v_count from public.reports
  where original_text = 'worker_report_created synthetic aggregate only';
  if v_count <> 0 then
    raise exception 'Supervisor B can read Worker A report from another facility';
  end if;
  select count(*) into v_count from public.report_items ri
  join public.reports r on r.id = ri.report_id
  where r.original_text = 'worker_report_created synthetic second facility';
  if v_count <> 1 then
    raise exception 'Supervisor B must see the stock observation in their assigned facility';
  end if;
  select count(*) into v_count from public.report_items ri
  join public.reports r on r.id = ri.report_id
  where r.original_text = 'worker_report_created synthetic aggregate only';
  if v_count <> 0 then
    raise exception 'Supervisor B can read report items from another facility';
  end if;

  update public.reports
  set status = 'supervisor_verified'
  where original_text = 'worker_report_created synthetic aggregate only';
  get diagnostics v_updated = row_count;
  if v_updated <> 0 then
    raise exception 'Supervisor B unexpectedly updated Worker A report';
  end if;

  update public.reports
  set status = 'supervisor_verified', review_note = 'Worker B report reviewed in synthetic CI test'
  where original_text = 'worker_report_created synthetic second facility';
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'Supervisor B could not verify the report in their assigned facility';
  end if;
end $supervisor_b_scope_check$;
commit;

-- District admin sees Dhamtari only; state admin sees both facilities.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
do $$
declare v_count integer;
begin
  select count(*) into v_count from public.facilities;
  if v_count <> 1 then raise exception 'District admin should see exactly one assigned district, got %', v_count; end if;
  select count(*) into v_count from public.reports;
  if v_count <> 1 then raise exception 'District admin report scope leak: expected 1, got %', v_count; end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
do $$
declare v_count integer; v_status text;
begin
  select count(*) into v_count from public.facilities;
  if v_count <> 2 then raise exception 'State admin should see both seeded test facilities, got %', v_count; end if;
  select count(*) into v_count from public.reports;
  if v_count <> 2 then raise exception 'State admin should see two scoped reports, got %', v_count; end if;
end $$;
update public.reports
set status = 'closed'
where original_text = 'worker_report_created synthetic aggregate only';
do $$
declare v_status text;
begin
  select status into v_status from public.reports
  where original_text = 'worker_report_created synthetic aggregate only';
  if v_status <> 'supervisor_verified' then raise exception 'State admin unexpectedly received supervisor write authority'; end if;
end $$;
commit;

select 'BUSHO PostgreSQL RLS contract passed' as result;

-- Facility registry staging, scoped human verification and audited promotion.
begin;
set local role service_role;
do $facility_registry_contract$
declare
  v_batch_id uuid;
  v_candidate_id uuid;
  v_result jsonb;
  v_facility_id uuid;
  v_count integer;
  v_blocked boolean := false;
begin
  v_result := public.create_facility_registry_import_batch(
    '44444444-4444-4444-8444-444444444444',
    'Synthetic CI facility source', current_date,
    'https://test.gov.in/facilities', 1
  );
  v_batch_id := (v_result->>'id')::uuid;

  v_result := public.stage_facility_registry_candidates(
    v_batch_id,
    '44444444-4444-4444-8444-444444444444',
    '[{"external_registry_id":"CI-FAC-001","name":"Synthetic CI PHC Candidate","state_lgd_code":"22","district_lgd_code":"377","block_lgd_code":null,"facility_type":"phc","source_row":2}]'::jsonb
  );
  if (v_result->>'staged')::integer <> 1 then
    raise exception 'Facility staging did not accept exactly one candidate: %', v_result;
  end if;

  select id into v_candidate_id from public.facility_registry_candidates
  where batch_id = v_batch_id and external_registry_id = 'CI-FAC-001';

  v_result := public.review_facility_registry_candidate(
    v_candidate_id,
    '44444444-4444-4444-8444-444444444444',
    'verify',
    'Verified against the synthetic CI facility source fixture.'
  );
  v_facility_id := (v_result->>'facilityId')::uuid;
  if v_facility_id is null then raise exception 'Facility verification did not create a facility ID'; end if;

  perform public.complete_facility_registry_batch(v_batch_id,'44444444-4444-4444-8444-444444444444');
  select count(*) into v_count from public.facility_registry_import_batches
  where id = v_batch_id and status = 'completed' and verified_rows = 1;
  if v_count <> 1 then raise exception 'Facility import batch did not complete with verified count'; end if;

  v_result := public.create_facility_registry_import_batch(
    '55555555-5555-4555-8555-555555555555',
    'Synthetic CI facility source', current_date,
    'https://test.gov.in/facilities', 1
  );
  v_batch_id := (v_result->>'id')::uuid;

  begin
    perform public.stage_facility_registry_candidates(
      v_batch_id,
      '55555555-5555-4555-8555-555555555555',
      '[{"external_registry_id":"CI-FAC-OUTSIDE","name":"Outside District Candidate","state_lgd_code":"22","district_lgd_code":"646","block_lgd_code":null,"facility_type":"phc","source_row":2}]'::jsonb
    );
  exception when insufficient_privilege then
    v_blocked := true;
  end;
  if not v_blocked then raise exception 'District admin staged a facility outside their assigned district'; end if;
end $facility_registry_contract$;
reset role;
do $facility_registry_promotion_check$
declare
  v_count integer;
begin
  select count(*) into v_count from public.facilities
  where verification_status = 'verified' and is_synthetic = false
    and external_registry_id = 'CI-FAC-001';
  if v_count <> 1 then raise exception 'Verified facility was not promoted with correct provenance'; end if;
  select count(*) into v_count from public.audit_logs
  where action = 'facility_registry_candidate_verified'
    and entity_id = (select id from public.facilities where external_registry_id = 'CI-FAC-001');
  if v_count <> 1 then raise exception 'Verified facility promotion did not create an audit event'; end if;
  select count(*) into v_count from public.audit_logs
  where action = 'facility_registry_candidates_staged'
    and metadata->>'actor_id' = '44444444-4444-4444-8444-444444444444';
  if v_count <> 1 then raise exception 'Facility staging did not create an audit event'; end if;
  select count(*) into v_count from public.audit_logs
  where action = 'facility_registry_batch_completed'
    and metadata->>'actor_id' = '44444444-4444-4444-8444-444444444444';
  if v_count <> 1 then raise exception 'Facility batch completion did not create an audit event'; end if;
end $facility_registry_promotion_check$;
commit;
