-- BUSHO initial operational schema.
-- This migration intentionally stores facility-level operational reports,
-- not patient-level medical records or patient identifiers.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  display_name TEXT NOT NULL,
  whatsapp_number TEXT UNIQUE NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  role TEXT NOT NULL DEFAULT 'worker'
    CHECK (role IN ('worker', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  channel TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed', 'blocked')),
  current_state TEXT NOT NULL DEFAULT 'idle',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  provider_message_id TEXT UNIQUE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL
    CHECK (message_type IN ('text', 'audio', 'interactive', 'other')),
  text_content TEXT,
  media_mime_type TEXT,
  media_storage_key TEXT,
  detected_language TEXT,
  processing_status TEXT NOT NULL DEFAULT 'received'
    CHECK (processing_status IN (
      'received', 'queued', 'processing', 'processed', 'failed', 'ignored'
    )),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  worker_id UUID NOT NULL REFERENCES workers(id),
  conversation_id UUID REFERENCES conversations(id),
  source_message_id UUID REFERENCES messages(id),
  reporting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  original_text TEXT,
  language_code TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'needs_clarification', 'awaiting_confirmation',
      'confirmed', 'rejected', 'superseded'
    )),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL
    CHECK (item_type IN ('symptom_trend', 'stock_observation')),
  item_code TEXT,
  display_label TEXT NOT NULL,
  quantity NUMERIC CHECK (quantity IS NULL OR quantity >= 0),
  unit TEXT,
  value_text TEXT,
  confidence NUMERIC CHECK (
    confidence IS NULL OR confidence BETWEEN 0 AND 1
  ),
  requires_review BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  item_code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (facility_id, item_code)
);

CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  observed_by UUID REFERENCES workers(id),
  source TEXT NOT NULL DEFAULT 'worker_report'
);

CREATE TABLE IF NOT EXISTS replenishment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  requested_quantity NUMERIC NOT NULL CHECK (requested_quantity > 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_by UUID REFERENCES workers(id),
  reviewed_by UUID REFERENCES workers(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id),
  report_id UUID REFERENCES reports(id),
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai', 'rules')),
  model TEXT NOT NULL,
  task TEXT NOT NULL,
  language_code TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_worker_id UUID REFERENCES workers(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workers_facility
  ON workers(facility_id);

CREATE INDEX IF NOT EXISTS idx_conversations_worker_recent
  ON conversations(worker_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_recent
  ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_facility_date
  ON reports(facility_id, reporting_date DESC);

CREATE INDEX IF NOT EXISTS idx_reports_status
  ON reports(status);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_latest
  ON inventory_snapshots(inventory_item_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_runs_provider_recent
  ON ai_runs(provider, created_at DESC);
