-- Part 2D: versioned, source-attributed medicine reference catalogue.
-- Reference catalogue rows are NOT inventory balances or clinical instructions.
-- Apply in CI only; live migration requires a separately approved release.

begin;

create table if not exists public.medicine_catalogue_releases (
  id uuid primary key default gen_random_uuid(),
  catalogue_code text not null,
  catalogue_name text not null,
  state_lgd_code text not null references public.states(lgd_code),
  source_authority text not null check (length(btrim(source_authority)) between 3 and 200),
  source_date date not null,
  publication_date date,
  source_url text not null check (source_url ~* '^https://'),
  source_document_title text not null,
  version_label text not null,
  status text not null default 'reference_only'
    check (status in ('reference_only','under_review','approved_for_reference','superseded')),
  source_notes text,
  created_at timestamptz not null default now(),
  unique (catalogue_code, version_label)
);

create table if not exists public.medicine_catalogue_entries (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.medicine_catalogue_releases(id) on delete restrict,
  source_annexure text not null check (source_annexure in ('district_hospital','civil_ch_chc_uchc','phc_phc_aam_uphc','shc_aam')),
  facility_level text not null check (facility_level in ('district_hospital','civil_hospital','chc','uchc','phc','phc_aam','uphc','shc_aam')),
  source_item_number integer not null check (source_item_number > 0),
  source_page integer not null check (source_page > 0),
  therapeutic_category_source text,
  source_description text not null check (length(btrim(source_description)) between 1 and 2000),
  normalized_name text,
  dosage_form text,
  strength_text text,
  standard_stock_unit text,
  parsing_status text not null default 'source_text_only'
    check (parsing_status in ('source_text_only','parsed_needs_review','verified')),
  clinical_reviewed_by text,
  clinical_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (release_id, source_annexure, source_item_number),
  constraint medicine_entry_review_pair_check check (
    (parsing_status <> 'verified' and clinical_reviewed_by is null and clinical_reviewed_at is null)
    or (parsing_status = 'verified' and clinical_reviewed_by is not null and clinical_reviewed_at is not null)
  )
);

create index if not exists medicine_catalogue_entries_release_level_idx
  on public.medicine_catalogue_entries(release_id, facility_level, source_item_number);

alter table public.inventory_items
  add column if not exists medicine_catalogue_entry_id uuid
  references public.medicine_catalogue_entries(id) on delete restrict;

comment on table public.medicine_catalogue_releases is
  'Versioned official or approved medicine reference sources. Release status does not imply a facility stock balance.';
comment on table public.medicine_catalogue_entries is
  'Verbatim source entries retained for traceability; normalized medicine attributes require separate review.';
comment on column public.inventory_items.medicine_catalogue_entry_id is
  'Optional link from a facility-specific stock item to a reviewed catalogue entry; not a stock or procurement authority.';

alter table public.medicine_catalogue_releases enable row level security;
alter table public.medicine_catalogue_entries enable row level security;
revoke all privileges on public.medicine_catalogue_releases from anon, authenticated;
revoke all privileges on public.medicine_catalogue_entries from anon, authenticated;
grant select on public.medicine_catalogue_releases, public.medicine_catalogue_entries to authenticated;
grant all privileges on public.medicine_catalogue_releases, public.medicine_catalogue_entries to service_role;

create policy medicine_catalogue_releases_authenticated_read
  on public.medicine_catalogue_releases
  for select to authenticated using (true);
create policy medicine_catalogue_entries_authenticated_read
  on public.medicine_catalogue_entries
  for select to authenticated using (true);

commit;
