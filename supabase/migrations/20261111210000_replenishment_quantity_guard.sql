-- Retain quantity integrity after deduplicating catalogue validation.
-- Catalogue activity/facility/unit checks remain in
-- app_private.validate_replenishment_inventory_item().
create or replace function app_private.validate_replenishment_quantities()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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

drop trigger if exists busho_validate_replenishment_quantities
  on public.replenishment_requests;
create trigger busho_validate_replenishment_quantities
before insert on public.replenishment_requests
for each row
execute function app_private.validate_replenishment_quantities();
