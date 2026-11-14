-- Synthetic-only contract for the SHC-to-PHC stockout exception workflow.
-- Run after the main PostgreSQL RLS contract in disposable CI.
insert into auth.users(id,raw_user_meta_data) values
 ('88888888-8888-4888-8888-888888888888','{"full_name":"Synthetic PHC Storekeeper"}')
on conflict(id) do nothing;
update public.profiles set role='storekeeper',status='active' where id='88888888-8888-4888-8888-888888888888';

insert into public.facilities
 (id,name,district,state,state_lgd_code,district_lgd_code,block_lgd_code,facility_type,verification_status,is_synthetic)
values
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Synthetic Dhamtari PHC','Dhamtari','Chhattisgarh','22','377','3625','phc','verified',true)
on conflict(id) do nothing;

insert into public.user_facility_assignments(user_id,facility_id,assignment_role)
values
 ('33333333-3333-4333-8333-333333333333','dddddddd-dddd-4ddd-8ddd-dddddddddddd','supervisor'),
 ('88888888-8888-4888-8888-888888888888','dddddddd-dddd-4ddd-8ddd-dddddddddddd','storekeeper')
on conflict(user_id,facility_id,assignment_role) do nothing;

set role service_role;
insert into public.facility_service_links
 (shc_facility_id,phc_facility_id,verification_status,source_authority,source_reference,verified_at,data_mode)
values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'verified','Synthetic CI relationship fixture','DEMO-LINK-001',now(),'synthetic_demo')
on conflict do nothing;
reset role;

-- Branch A: PHC has stock; SHC collects and confirms full receipt.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.stockout_cases
 (shc_facility_id,phc_facility_id,submitted_by_worker_id,medicine_name,medicine_source_reference,
  reported_quantity,requested_quantity,quantity_unit,observation_source,observed_at,status,data_mode)
values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '10000000-0000-4000-8000-000000000001','Synthetic hypertension medicine','DEMO-EDL-ROW-001',
  0,100,'tablets','dispensing_box_check',now(),'submitted_to_phc','synthetic_demo');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
update public.stockout_cases set status='acknowledged_by_phc'
where medicine_source_reference='DEMO-EDL-ROW-001';
update public.stockout_cases set status='accepted_for_phc_action',phc_available_quantity=100,phc_review_note='Synthetic PHC availability observation'
where medicine_source_reference='DEMO-EDL-ROW-001';
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
update public.stockout_cases set status='phc_handover_recorded',phc_handover_quantity=100,
 phc_handover_reference='DEMO-PHC-ISSUE-001',phc_handover_at=now()
where medicine_source_reference='DEMO-EDL-ROW-001';
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
update public.stockout_cases set status='collected_by_shc',shc_collection_reference='DEMO-SHC-COLLECT-001',shc_collected_at=now()
where medicine_source_reference='DEMO-EDL-ROW-001';
update public.stockout_cases set status='received_at_shc',shc_received_quantity=100,
 shc_receipt_reference='DEMO-SHC-GRN-001',shc_received_at=now()
where medicine_source_reference='DEMO-EDL-ROW-001';
do $assert_full_receipt$
declare v_events integer; v_status text; v_qty numeric;
begin
 select status,shc_received_quantity into v_status,v_qty from public.stockout_cases where medicine_source_reference='DEMO-EDL-ROW-001';
 select count(*) into v_events from public.stockout_case_events e join public.stockout_cases c on c.id=e.stockout_case_id where c.medicine_source_reference='DEMO-EDL-ROW-001';
 if v_status<>'received_at_shc' or v_qty<>100 or v_events<5 then raise exception 'SHC-to-PHC direct fulfilment did not reconcile'; end if;
end $assert_full_receipt$;
commit;

-- Branch B: PHC cannot fulfil; storekeeper records only an external hand-off,
-- upstream PHC receipt and then the separate SHC handover.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.stockout_cases
 (shc_facility_id,phc_facility_id,submitted_by_worker_id,medicine_name,medicine_source_reference,
  reported_quantity,requested_quantity,quantity_unit,observation_source,observed_at,status,data_mode)
values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '10000000-0000-4000-8000-000000000001','Synthetic hypertension medicine','DEMO-EDL-ROW-002',
  0,60,'tablets','paper_register',now(),'submitted_to_phc','synthetic_demo');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
update public.stockout_cases set status='phc_cannot_fulfil',phc_available_quantity=0,phc_review_note='Synthetic PHC stock unavailable'
where medicine_source_reference='DEMO-EDL-ROW-002';
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
update public.stockout_cases set status='official_indent_submitted',official_system_name='DPDMIS (synthetic test)',
 official_indent_reference='DEMO-DPDMIS-001',official_indent_submitted_at=now()
where medicine_source_reference='DEMO-EDL-ROW-002';
update public.stockout_cases set status='upstream_supply_received_at_phc',
 upstream_received_quantity=60,upstream_receipt_reference='DEMO-PHC-WH-GRN-001',upstream_received_at=now()
where medicine_source_reference='DEMO-EDL-ROW-002';
update public.stockout_cases set status='phc_handover_recorded',phc_handover_quantity=60,
 phc_handover_reference='DEMO-PHC-ISSUE-002',phc_handover_at=now()
where medicine_source_reference='DEMO-EDL-ROW-002';
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
update public.stockout_cases set status='collected_by_shc',shc_collection_reference='DEMO-SHC-COLLECT-002',shc_collected_at=now()
where medicine_source_reference='DEMO-EDL-ROW-002';

-- Workers cannot overwrite PHC-owned official references, even while recording SHC receipt.
do $worker_cannot_edit_phc$
declare v_blocked boolean:=false;
begin
 begin
  update public.stockout_cases set official_indent_reference='FORGED-REFERENCE'
  where medicine_source_reference='DEMO-EDL-ROW-002';
 exception when others then v_blocked:=true;
 end;
 if not v_blocked then raise exception 'Worker changed PHC official indent reference'; end if;
end $worker_cannot_edit_phc$;

update public.stockout_cases set status='partially_received_at_shc',shc_received_quantity=40,
 shc_receipt_reference='DEMO-SHC-PART-001',shc_received_at=now()
where medicine_source_reference='DEMO-EDL-ROW-002';
update public.stockout_cases set status='received_at_shc',shc_received_quantity=60,
 shc_receipt_reference='DEMO-SHC-FINAL-001',shc_received_at=now()
where medicine_source_reference='DEMO-EDL-ROW-002';
do $assert_upstream_branch$
declare v_events integer; v_status text; v_ref text;
begin
 select status,official_indent_reference into v_status,v_ref from public.stockout_cases where medicine_source_reference='DEMO-EDL-ROW-002';
 select count(*) into v_events from public.stockout_case_events e join public.stockout_cases c on c.id=e.stockout_case_id where c.medicine_source_reference='DEMO-EDL-ROW-002';
 if v_status<>'received_at_shc' or v_ref<>'DEMO-DPDMIS-001' or v_events<7 then raise exception 'Upstream fulfilment branch did not reconcile'; end if;
end $assert_upstream_branch$;
commit;

-- Event history must reject authenticated mutation.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
do $events_append_only$
declare v_blocked boolean:=false;
begin
 begin
  update public.stockout_case_events set note='tampered';
  raise exception 'Stockout event update unexpectedly succeeded';
 exception when others then
  if sqlerrm='Stockout event update unexpectedly succeeded' then raise; end if;
  v_blocked:=true;
 end;
 if not v_blocked then raise exception 'Stockout event mutation was not blocked'; end if;
end $events_append_only$;
rollback;

select 'BUSHO SHC-to-PHC stockout workflow contract passed' as result;
