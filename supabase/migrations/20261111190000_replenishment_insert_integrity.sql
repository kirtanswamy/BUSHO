-- Enforce replenishment item/facility/unit/quantity integrity at the database boundary.
-- This migration is local/feature-branch work only; do not apply to production
-- without the project's explicit deployment approval.

create or replace function app_private.validate_replenishment_request_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
begin
  select ii.facility_id, ii.is_active, ii.unit
    into v_item
  from public.inventory_items ii
  where ii.id = new.inventory_item_id;

  if not found then
    raise exception 'The selected inventory item does not exist';
  end if;

  if v_item.is_active is distinct from true then
    raise exception 'The selected inventory item is inactive';
  end if;

  if v_item.facility_id is distinct from new.facility_id then
    raise exception 'The inventory item must belong to the request facility';
  end if;

  if nullif(btrim(new.unit), '') is null
     or new.unit is distinct from v_item.unit then
    raise exception 'The request unit must match the inventory item unit';
  end if;

  if new.requested_quantity is null
     or new.requested_quantity <= 0
     or new.requested_quantity <> trunc(new.requested_quantity) then
    raise exception 'Requested quantity must be a positive whole number';
  end if;

  if new.on_hand_quantity is null
     or new.on_hand_quantity < 0
     or new.on_hand_quantity <> trunc(new.on_hand_quantity) then
    raise exception 'Reported on-hand quantity must be a non-negative whole number';
  end if;

  return new;
end;
$$;

drop trigger if exists busho_validate_replenishment_request_insert
  on public.replenishment_requests;
create trigger busho_validate_replenishment_request_insert
before insert on public.replenishment_requests
for each row
execute function app_private.validate_replenishment_request_insert();
