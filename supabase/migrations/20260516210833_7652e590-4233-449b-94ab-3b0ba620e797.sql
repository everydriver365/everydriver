ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS calendar_sync_status TEXT
    NOT NULL DEFAULT 'pending'
    CHECK (calendar_sync_status IN ('pending','synced','failed','no-calendar'));

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_sync_status
  ON public.scheduled_lessons (calendar_sync_status)
  WHERE calendar_sync_status IN ('pending','failed');