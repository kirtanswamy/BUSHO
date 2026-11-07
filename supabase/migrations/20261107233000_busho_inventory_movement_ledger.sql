-- Part 2E.3: immutable inbound inventory movement ledger.
-- Receipts create movements; they do not overwrite inventory observations or
-- claim an external DPDMIS transaction occurred.
begin;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete restrict,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  replenishment_request_id uuid not null references public.replenishment_requests(id) on delete restrict,
  movement_type text not null check (movement_type = 'inbound_receipt'),
  quantity_delta numeric not null check (quantity_delta > 0),
  unit text not null check (length(btrim(unit)) > 0),
  external_reference text not null check (length(btrim(external_reference)) > 0),
  data_mode text not null check (data_mode in ('operational','synthetic_demo')),
  recorded_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_request_reference_uidx
    unique (replenishment_request_id, external_reference)
);

create index if not exists inventory_movements_facility_item_created_idx
  on public.inventory_movements(facility_id, inventory_item_id, created_at desc);
create index if not exists inventory_movements_request_created_idx
  on public.inventory_movements(replenishment_request_id, created_at);

alter table public.inventory_movements enable row level security;
grant select on public.inventory_movements to authenticated;

create policy inventory_movements_scoped_select on public.inventory_movements
  for select to authenticated
  using (app_private.has_facility_access(
    facility_id,
    array['supervisor','storekeeper','district_admin','state_admin']::text[]
  ));

create or replace function app_private.validate_replenishment_inventory_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.inventory_items ii
    where ii.id = new.inventory_item_id
      and ii.facility_id = new.facility_id
      and ii.is_active = true
      and ii.unit = new.unit
  ) then
    raise exception 'Replenishment item must be active, belong to the same facility and use the catalogue item unit';
  end if;
  return new;
end;
$$;

drop trigger if exists busho_validate_replenishment_inventory_item on public.replenishment_requests;
create trigger busho_validate_replenishment_inventory_item
before insert on public.replenishment_requests
for each row execute function app_private.validate_replenishment_inventory_item();

create or replace function app_private.record_inventory_receipt_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delta numeric;
begin
  v_delta := new.received_quantity - old.received_quantity;
  if v_delta <= 0 then
    return new;
  end if;

  if nullif(btrim(new.receipt_reference), '') is null then
    raise exception 'A receipt movement requires an external goods-receipt reference';
  end if;

  insert into public.inventory_movements (
    facility_id,
    inventory_item_id,
    replenishment_request_id,
    movement_type,
    quantity_delta,
    unit,
    external_reference,
    data_mode,
    recorded_by_user_id
  ) values (
    new.facility_id,
    new.inventory_item_id,
    new.id,
    'inbound_receipt',
    v_delta,
    new.unit,
    new.receipt_reference,
    new.data_mode,
    auth.uid()
  );

  return new;
end;
$$;

drop trigger if exists busho_record_inventory_receipt_movement on public.replenishment_requests;
create trigger busho_record_inventory_receipt_movement
after update of received_quantity on public.replenishment_requests
for each row
when (new.received_quantity > old.received_quantity)
execute function app_private.record_inventory_receipt_movement();

revoke all on function app_private.validate_replenishment_inventory_item() from public, anon, authenticated;
revoke all on function app_private.record_inventory_receipt_movement() from public, anon, authenticated;

commit;
