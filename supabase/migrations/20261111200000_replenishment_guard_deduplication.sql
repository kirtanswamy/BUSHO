-- The existing movement-ledger migration already validates catalogue item
-- activity, facility ownership and unit equality for replenishment inserts.
-- Keep that established guard as the single source of truth. The preceding
-- insert-integrity migration continues to enforce whole-number quantities.
drop trigger if exists busho_validate_replenishment_request_insert
  on public.replenishment_requests;
drop function if exists app_private.validate_replenishment_request_insert();
