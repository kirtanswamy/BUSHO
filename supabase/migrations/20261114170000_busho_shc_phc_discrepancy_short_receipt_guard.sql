-- A discrepancy is specifically a short receipt against a larger PHC handover.
-- Prevent a full receipt from being stranded in discrepancy_recorded.
begin;
alter table public.stockout_cases
  drop constraint if exists stockout_cases_discrepancy_must_be_short_receipt;
alter table public.stockout_cases
  add constraint stockout_cases_discrepancy_must_be_short_receipt
  check (
    status <> 'discrepancy_recorded'
    or (
      phc_handover_quantity is not null
      and shc_received_quantity is not null
      and shc_received_quantity < phc_handover_quantity
    )
  );
commit;
