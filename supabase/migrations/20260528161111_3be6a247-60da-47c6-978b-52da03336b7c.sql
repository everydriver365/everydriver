ALTER TABLE public.calendar_sync_queue
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_calendar_sync_queue_retry
  ON public.calendar_sync_queue (next_retry_at)
  WHERE processed_at IS NULL;