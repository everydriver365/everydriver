ALTER TABLE public.famulor_settings
  ADD COLUMN IF NOT EXISTS inbound_answering_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_verified_status TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_message TEXT;