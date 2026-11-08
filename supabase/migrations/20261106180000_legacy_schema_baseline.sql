-- Local Supabase legacy-schema baseline. Synthetic test schema only; no operational data.

create extension if not exists pgcrypto;

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text,
  state text,
  created_at timestamptz not null default now()
);

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id),
  display_name text not null,
  whatsapp_number text not null unique,
  preferred_language text not null default 'en',
  role text not null default 'worker' check (role = any (array['worker'::text,'admin'::text])),
  is_active boolean not null default true,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id),
  channel text not null default 'whatsapp' check (channel = 'whatsapp'),
  status text not null default 'active' check (status = any (array['active'::text,'closed'::text,'blocked'::text])),
  current_state text not null default 'idle',
  context jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id),
  provider_message_id text not null unique,
  direction text not null check (direction = any (array['inbound'::text,'outbound'::text])),
  message_type text not null check (message_type = any (array['text'::text,'audio'::text,'interactive'::text,'other'::text])),
  text_content text,
  media_mime_type text,
  media_storage_key text,
  detected_language text,
  processing_status text not null default 'received' check (processing_status = any (array['received'::text,'queued'::text,'processing'::text,'processed'::text,'failed'::text,'ignored'::text])),
  error_code text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id),
  worker_id uuid not null references public.workers(id),
  conversation_id uuid references public.conversations(id),
  source_message_id uuid references public.messages(id),
  reporting_date date not null default current_date,
  original_text text,
  language_code text not null default 'en',
  status text not null default 'draft'
    check (status = any (array['draft'::text,'needs_clarification'::text,'awaiting_confirmation'::text,'confirmed'::text,'rejected'::text,'superseded'::text])),
  summary jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id),
  item_type text not null check (item_type = any (array['symptom_trend'::text,'stock_observation'::text])),
  item_code text,
  display_label text not null,
  quantity numeric check (quantity is null or quantity >= 0),
  unit text,
  value_text text,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  requires_review boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id),
  item_code text not null,
  name text not null,
  unit text not null,
  is_active boolean not null default true,
  unique (facility_id, item_code)
);

create table public.inventory_snapshots (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id),
  quantity numeric not null check (quantity >= 0),
  observed_at timestamptz not null default now(),
  observed_by uuid references public.workers(id),
  source text not null default 'worker_report'
);

create table public.replenishment_requests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id),
  inventory_item_id uuid not null references public.inventory_items(id),
  requested_quantity numeric not null check (requested_quantity > 0),
  status text not null default 'draft'
    check (status = any (array['draft'::text,'submitted'::text,'approved'::text,'rejected'::text])),
  created_by uuid references public.workers(id),
  reviewed_by uuid references public.workers(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id),
  report_id uuid references public.reports(id),
  provider text not null check (provider = any (array['gemini'::text,'openai'::text,'rules'::text])),
  model text not null,
  task text not null,
  language_code text,
  success boolean not null default false,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  fallback_used boolean not null default false,
  error_code text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_worker_id uuid references public.workers(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
