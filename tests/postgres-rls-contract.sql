-- Runs only against the disposable PostgreSQL 17 CI service.
-- Uses synthetic identities, aggregate-only reports and fake external references.

insert into auth.users (id, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', '{"full_name":"Synthetic Worker A"}'),
  ('22222222-2222-4222-8222-222222222222', '{"full_name":"Synthetic Worker B"}'),
  ('33333333-3333-4333-8333-333333333333', '{"full_name":"Synthetic Supervisor"}'),
  ('44444444-4444-4444-8444-444444444444', '{"full_name":"Synthetic State Admin"}'),
  ('55555555-5555-4555-8555-555555555555', '{"full_name":"Synthetic District Admin"}'),
  ('66666666-6666-4666-8666-666666666666', '{"full_name":"Synthetic Supervisor B"}'),
  ('77777777-7777-4777-8777-777777777777', '{"full_name":"Synthetic Storekeeper B"}');

update public.profiles
set role = case id
  when '11111111-1111-4111-8111-111111111111' then 'worker'
  when '22222222-2222-4222-8222-222222222222' then 'worker'
  when '33333333-3333-4333-8333-333333333333' then 'supervisor'
  when '44444444-4444-4444-8444-444444444444' then 'state_admin'
  when '55555555-5555-4555-8555-555555555555' then 'district_admin'
  when '66666666-6666-4666-8666-666666666666' then 'supervisor'
  when '77777777-7777-4777-8777-777777777777' then 'storekeeper'
end,
status = 'active'
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777'
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
  ('66666666-6666-4666-8666-666666666666', 'block', '22', '646', '3629', 'supervisor'),
  ('77777777-7777-4777-8777-777777777777', 'block', '22', '646', '3629', 'storekeeper');

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

do $$
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
  select count(*) into v_count from public.workers;
  if v_count <> 1 then
    raise exception 'Supervisor B worker scope leak: expected 1, got %', v_count;
  end if;
  select count(*) into v_count from public.workers
  where auth_user_id = '11111111-1111-4111-8111-111111111111';
  if v_count <> 0 then
    raise exception 'Supervisor B can see Worker A from another facility';
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

-- An assigned supervisor can return a recommendation with a reason.
-- The disposable fixture is rolled back after the authorization assertion.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
insert into public.replenishment_requests
  (facility_id, inventory_item_id, requested_quantity, status, source_report_id,
   on_hand_quantity, unit, note, data_mode)
select r.facility_id, '20000000-0000-4000-8000-000000000002', 3,
       'recommended_to_facility_store', r.id, 0, 'packets',
       'Synthetic supervisor clarification return fixture', 'synthetic_demo'
from public.reports r
where r.original_text = 'worker_report_created synthetic second facility';
update public.replenishment_requests
set status = 'returned_for_clarification',
    note = 'Please clarify the stock observation'
where note = 'Synthetic supervisor clarification return fixture';
do $supervisor_can_return$
declare v_status text;
begin
  select status into v_status
  from public.replenishment_requests
  where note = 'Please clarify the stock observation';
  if v_status is distinct from 'returned_for_clarification' then
    raise exception 'Assigned supervisor could not return recommendation; status %', v_status;
  end if;
end $supervisor_can_return$;
rollback;
-- Storekeeper cannot approve a recommendation. Create a disposable Balod
-- recommendation as the assigned supervisor, attempt the forbidden transition
-- as the assigned storekeeper, then roll back the fixture.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
insert into public.replenishment_requests
  (facility_id, inventory_item_id, requested_quantity, status, source_report_id,
   on_hand_quantity, unit, note, data_mode)
select r.facility_id, '20000000-0000-4000-8000-000000000002', 3,
       'recommended_to_facility_store', r.id, 0, 'packets',
       'Synthetic storekeeper approval denial fixture', 'synthetic_demo'
from public.reports r
where r.original_text = 'worker_report_created synthetic second facility';
set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
do $storekeeper_cannot_return$
declare v_blocked boolean := false;
begin
  begin
    update public.replenishment_requests
    set status = 'returned_for_clarification',
        note = 'Storekeeper must not return this recommendation'
    where note = 'Synthetic storekeeper approval denial fixture';
  exception when others then
    v_blocked := true;
  end;

  if not v_blocked then
    raise exception 'Storekeeper was able to return a recommendation for clarification';
  end if;

  if not exists (
    select 1 from public.replenishment_requests
    where note = 'Synthetic storekeeper approval denial fixture'
      and status = 'recommended_to_facility_store'
  ) then
    raise exception 'Rejected storekeeper return changed the recommendation';
  end if;
end $storekeeper_cannot_return$;
do $storekeeper_cannot_approve$
declare v_blocked boolean := false;
begin
  begin
    update public.replenishment_requests
    set status = 'supervisor_approved'
    where note = 'Synthetic storekeeper approval denial fixture';
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then
    raise exception 'Storekeeper was able to approve a supervisor recommendation';
  end if;
end $storekeeper_cannot_approve$;
rollback;

-- Supervisor B creates a Balod replenishment recommendation from their verified report.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
do $inventory_item_scope_guard$
declare
  v_blocked boolean := false;
begin
  begin
    insert into public.replenishment_requests
      (facility_id, inventory_item_id, requested_quantity, status, source_report_id,
       on_hand_quantity, unit, note, data_mode)
    select
      r.facility_id,
      '20000000-0000-4000-8000-000000000001',
      5,
      'draft',
      r.id,
      1,
      'packets',
      'Invalid cross-facility inventory item',
      'synthetic_demo'
    from public.reports r
    where r.original_text = 'worker_report_created synthetic second facility';
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then
    raise exception 'Supervisor created replenishment against another facility inventory item';
  end if;
end $inventory_item_scope_guard$;
insert into public.replenishment_requests
  (facility_id, inventory_item_id, requested_quantity, status, source_report_id,
   on_hand_quantity, unit, note, data_mode, submission_key)
select
  r.facility_id,
  '20000000-0000-4000-8000-000000000002',
  10,
  'draft',
  r.id,
  2,
  'packets',
  'Synthetic Balod replenishment recommendation',
  'synthetic_demo',
  '88888888-8888-4888-8888-888888888888'
from public.reports r
where r.original_text = 'worker_report_created synthetic second facility';

-- A repeated browser submission with the same supervisor-scoped key must
-- fail at the database boundary rather than create a second request.
do $replenishment_submission_key_duplicate$
declare
  v_blocked boolean := false;
begin
  begin
    insert into public.replenishment_requests
      (facility_id, inventory_item_id, requested_quantity, status, source_report_id,
       on_hand_quantity, unit, note, data_mode, submission_key)
    select
      r.facility_id,
      '20000000-0000-4000-8000-000000000002',
      10,
      'draft',
      r.id,
      2,
      'packets',
      'Synthetic duplicate Balod recommendation',
      'synthetic_demo',
      '88888888-8888-4888-8888-888888888888'
    from public.reports r
    where r.original_text = 'worker_report_created synthetic second facility';
  exception when unique_violation then
    v_blocked := true;
  end;
  if not v_blocked then
    raise exception 'Duplicate supervisor submission key created a second replenishment request';
  end if;
end $replenishment_submission_key_duplicate$;

-- Once persisted, a retry key is immutable even to its creating supervisor.
do $replenishment_submission_key_immutable$
declare
  v_blocked boolean := false;
begin
  begin
    update public.replenishment_requests
    set submission_key = '99999999-9999-4999-9999-999999999999'
    where note = 'Synthetic Balod replenishment recommendation';
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then
    raise exception 'Supervisor changed an existing replenishment submission key';
  end if;
  if not exists (
    select 1 from public.replenishment_requests
    where note = 'Synthetic Balod replenishment recommendation'
      and submission_key = '88888888-8888-4888-8888-888888888888'
  ) then
    raise exception 'Rejected submission-key update changed the original key';
  end if;
end $replenishment_submission_key_immutable$;

update public.replenishment_requests
set status = 'recommended_to_facility_store'
where note = 'Synthetic Balod replenishment recommendation';
update public.replenishment_requests
set status = 'supervisor_approved'
where note = 'Synthetic Balod replenishment recommendation';
update public.replenishment_requests
set status = 'submitted_to_dpdmis', dpdmis_reference = 'DPDMIS-TEST-BALOD-001'
where note = 'Synthetic Balod replenishment recommendation';
commit;

-- A DPDMIS-submitted request cannot be moved backwards into clarification.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
do $supervisor_cannot_return_dpdmis$
declare v_blocked boolean := false;
begin
  begin
    update public.replenishment_requests
    set status = 'returned_for_clarification',
        note = 'Attempted return after DPDMIS submission'
    where note = 'Synthetic Balod replenishment recommendation';
  exception when others then
    v_blocked := true;
  end;

  if not v_blocked then
    raise exception 'Supervisor returned a request already submitted to DPDMIS';
  end if;

  if not exists (
    select 1 from public.replenishment_requests
    where note = 'Synthetic Balod replenishment recommendation'
      and status = 'submitted_to_dpdmis'
      and dpdmis_reference = 'DPDMIS-TEST-BALOD-001'
  ) then
    raise exception 'Rejected DPDMIS return changed the submitted request';
  end if;
end $supervisor_cannot_return_dpdmis$;
commit;
-- A supervisor may approve and submit the recommendation, but may not
-- perform storekeeper allocation, dispatch or receipt transitions.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
do $supervisor_separation_check$
declare
  v_blocked boolean := false;
begin
  begin
    update public.replenishment_requests
    set status = 'allocated', allocation_reference = 'SUPERVISOR-MUST-NOT-ALLOCATE'
    where note = 'Synthetic Balod replenishment recommendation';
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then
    raise exception 'Supervisor was able to perform storekeeper-only allocation';
  end if;
end $supervisor_separation_check$;
commit;

-- Balod storekeeper sees only the Balod request and can record supply-chain
-- allocation, dispatch and two receipts. Cross-facility mutation is blocked.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
do $storekeeper_scope_check$
declare
  v_count integer;
  v_updated integer;
begin
  select count(*) into v_count from public.replenishment_requests;
  if v_count <> 1 then
    raise exception 'Storekeeper must see only the Balod request; got %', v_count;
  end if;
  select count(*) into v_count from public.replenishment_requests
  where note = 'Synthetic replenishment recommendation';
  if v_count <> 0 then
    raise exception 'Balod storekeeper can read Dhamtari replenishment request';
  end if;
  select count(*) into v_count from public.replenishment_events;
  if v_count < 4 then
    raise exception 'Storekeeper should see Balod workflow event history; got %', v_count;
  end if;

  -- Dispatch must not skip the allocation step.
  begin
    update public.replenishment_requests
    set status = 'dispatched', dispatch_reference = 'CHALLAN-BEFORE-ALLOCATION'
    where note = 'Synthetic Balod replenishment recommendation';
    raise exception 'Dispatch before allocation unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Dispatch before allocation unexpectedly succeeded' then raise; end if;
  end;

  raise notice 'CHECKPOINT: before allocation';
  update public.replenishment_requests
  set status = 'allocated', allocation_reference = 'ALLOC-TEST-BALOD-001'
  where note = 'Synthetic Balod replenishment recommendation';
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'Storekeeper could not record allocation'; end if;

  raise notice 'CHECKPOINT: before dispatch';
  update public.replenishment_requests
  set status = 'dispatched', dispatch_reference = 'CHALLAN-TEST-BALOD-001'
  where note = 'Synthetic Balod replenishment recommendation';
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'Storekeeper could not record dispatch'; end if;

  -- An over-receipt must be rejected without changing the request.
  begin
    update public.replenishment_requests
    set status = 'received', received_quantity = 11,
        receipt_reference = 'GRN-OVER-RECEIPT-001'
    where note = 'Synthetic Balod replenishment recommendation';
    raise exception 'Over-receipt unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Over-receipt unexpectedly succeeded' then raise; end if;
  end;

  raise notice 'CHECKPOINT: before partial receipt';
  update public.replenishment_requests
  set status = 'partially_received', received_quantity = 4,
      receipt_reference = 'GRN-TEST-BALOD-PART-001'
  where note = 'Synthetic Balod replenishment recommendation';
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'Storekeeper could not record partial receipt'; end if;

  -- A GRN reference cannot be reused for a second quantity increment.
  do $duplicate_grn_reference$
  declare
    v_blocked boolean := false;
    v_received numeric;
  begin
    begin
      update public.replenishment_requests
      set status = 'partially_received',
          received_quantity = 6,
          receipt_reference = 'GRN-TEST-BALOD-PART-001'
      where note = 'Synthetic Balod replenishment recommendation';
    exception when others then
      v_blocked := true;
    end;

    if not v_blocked then
      raise exception 'Duplicate GRN reference unexpectedly accepted a new receipt increment';
    end if;

    select received_quantity into v_received
    from public.replenishment_requests
    where note = 'Synthetic Balod replenishment recommendation';

    if v_received <> 4 then
      raise exception 'Rejected duplicate GRN changed received quantity to %', v_received;
    end if;
  end $duplicate_grn_reference$;
  raise notice 'CHECKPOINT: before final receipt';
  update public.replenishment_requests
  set status = 'received', received_quantity = 10,
      receipt_reference = 'GRN-TEST-BALOD-FINAL-001'
  where note = 'Synthetic Balod replenishment recommendation';
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'Storekeeper could not close full receipt'; end if;

  raise notice 'CHECKPOINT: before exact receipt retry';
  -- Replay the exact final receipt under the same authenticated storekeeper
  -- transaction; it must not append another movement or receipt event.
  update public.replenishment_requests
  set status = 'received', received_quantity = 10,
      receipt_reference = 'GRN-TEST-BALOD-FINAL-001'
  where note = 'Synthetic Balod replenishment recommendation';
  do $receipt_retry_in_scope_check$
  declare
    v_movements integer;
    v_receipts integer;
  begin
    select count(*) into v_movements
    from public.inventory_movements im
    join public.replenishment_requests rr on rr.id = im.replenishment_request_id
    where rr.note = 'Synthetic Balod replenishment recommendation';
    select count(*) into v_receipts
    from public.replenishment_events re
    join public.replenishment_requests rr on rr.id = re.replenishment_request_id
    where rr.note = 'Synthetic Balod replenishment recommendation'
      and re.action = 'receipt_recorded';
    if v_movements <> 2 or v_receipts <> 2 then
      raise exception 'Exact receipt retry duplicated ledger entries: movements %, receipt events %', v_movements, v_receipts;
    end if;
  end $receipt_retry_in_scope_check$;

  -- A cross-facility update must fail closed. Depending on which guard
  -- rejects it first, RLS may affect zero rows or the transition trigger may
  -- raise. Both are acceptable only if the Dhamtari row remains unchanged.
  begin
    update public.replenishment_requests
    set status = 'received', received_quantity = 10,
        receipt_reference = 'GRN-OVERWRITE-ATTEMPT'
    where note = 'Synthetic replenishment recommendation';
    get diagnostics v_updated = row_count;
    if v_updated <> 0 then
      raise exception 'Balod storekeeper updated Dhamtari request';
    end if;
  exception when others then
    if sqlerrm = 'Balod storekeeper updated Dhamtari request' then raise; end if;
    -- An authorization/transition rejection is an acceptable fail-closed result.
  end;
  -- The authenticated storekeeper cannot SELECT the other facility's
  -- row by design. Its unchanged state is asserted later outside this RLS
  -- transaction, after the role has been reset.
end $storekeeper_scope_check$;
-- Replaying the final receipt PATCH with the same cumulative quantity/reference
-- must be idempotent: it must not append a second movement or receipt event.
set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
update public.replenishment_requests
set status = 'received', received_quantity = 10,
    receipt_reference = 'GRN-TEST-BALOD-FINAL-001'
where note = 'Synthetic Balod replenishment recommendation';
do $receipt_retry_idempotency$
declare
  v_movements integer;
  v_receipts integer;
begin
  select count(*) into v_movements
  from public.inventory_movements im
  join public.replenishment_requests rr on rr.id = im.replenishment_request_id
  where rr.note = 'Synthetic Balod replenishment recommendation';
  select count(*) into v_receipts
  from public.replenishment_events re
  join public.replenishment_requests rr on rr.id = re.replenishment_request_id
  where rr.note = 'Synthetic Balod replenishment recommendation'
    and re.action = 'receipt_recorded';
  if v_movements <> 2 then
    raise exception 'Retry duplicated receipt movement; expected 2, got %', v_movements;
  end if;
  if v_receipts <> 2 then
    raise exception 'Retry duplicated receipt event; expected 2, got %', v_receipts;
  end if;
end $receipt_retry_idempotency$;
commit;
do $storekeeper_receipt_audit_check$
declare
  v_count integer;
  v_received numeric;
  v_status text;
begin
  select received_quantity,status into v_received,v_status
  from public.replenishment_requests
  where note = 'Synthetic Balod replenishment recommendation';
  if v_received <> 10 or v_status <> 'received' then
    raise exception 'Final receipt reconciliation is incorrect: % / %', v_received, v_status;
  end if;
  select count(*) into v_count
  from public.replenishment_requests
  where note = 'Synthetic replenishment recommendation'
    and status = 'submitted_to_dpdmis'
    and received_quantity = 0
    and receipt_reference is null;
  if v_count <> 1 then
    raise exception 'Cross-facility attempt altered the Dhamtari request';
  end if;
  select count(*) into v_count from public.replenishment_events re
  join public.replenishment_requests rr on rr.id = re.replenishment_request_id
  where rr.note = 'Synthetic Balod replenishment recommendation'
    and re.action = 'receipt_recorded';
  if v_count <> 2 then
    raise exception 'Expected partial and final receipt events, got %', v_count;
  end if;
  select count(*) into v_count from public.replenishment_events re
  join public.replenishment_requests rr on rr.id = re.replenishment_request_id
  where rr.note = 'Synthetic Balod replenishment recommendation'
    and re.external_reference in ('GRN-TEST-BALOD-PART-001','GRN-TEST-BALOD-FINAL-001');
  if v_count <> 2 then
    raise exception 'Receipt references were not recorded in immutable event history';
  end if;

  select count(*) into v_count
  from public.inventory_movements
  where replenishment_request_id = (
    select id from public.replenishment_requests
    where note = 'Synthetic Balod replenishment recommendation'
  );
  if v_count <> 2 then
    raise exception 'Each partial/final receipt must create one inventory movement; got %', v_count;
  end if;
  select coalesce(sum(quantity_delta),0) into v_received
  from public.inventory_movements
  where replenishment_request_id = (
    select id from public.replenishment_requests
    where note = 'Synthetic Balod replenishment recommendation'
  );
  if v_received <> 10 then
    raise exception 'Inventory movement ledger total must reconcile to 10 packets; got %', v_received;
  end if;
  select count(*) into v_count
  from public.inventory_movements
  where external_reference in ('GRN-TEST-BALOD-PART-001','GRN-TEST-BALOD-FINAL-001')
    and movement_type = 'inbound_receipt'
    and unit = 'packets'
    and data_mode = 'synthetic_demo';
  if v_count <> 2 then
    raise exception 'Inventory movement provenance/reference data is incomplete';
  end if;

end $storekeeper_receipt_audit_check$;

-- Verify append-only permissions under the real authenticated role, not the
-- privileged test/migration owner used by the audit block above.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
do $inventory_movement_immutable_check$
begin
  begin
    update public.inventory_movements
    set quantity_delta = 999
    where external_reference = 'GRN-TEST-BALOD-PART-001';
    raise exception 'Inventory movement update unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Inventory movement update unexpectedly succeeded' then raise; end if;
  end;
  begin
    delete from public.inventory_movements
    where external_reference = 'GRN-TEST-BALOD-PART-001';
    raise exception 'Inventory movement delete unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Inventory movement delete unexpectedly succeeded' then raise; end if;
  end;
end $inventory_movement_immutable_check$;
rollback;

-- Workers cannot browse the facility inventory movement ledger.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
do $worker_inventory_movement_scope$
declare
  v_count integer;
begin
  select count(*) into v_count from public.inventory_movements;
  if v_count <> 0 then
    raise exception 'Worker must not read the facility inventory movement ledger';
  end if;
end $worker_inventory_movement_scope$;
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
