ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS dbs_update_service_subscribed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dbs_update_service_expiry date,
  ADD COLUMN IF NOT EXISTS dbs_update_service_reminder_sent_at timestamptz;