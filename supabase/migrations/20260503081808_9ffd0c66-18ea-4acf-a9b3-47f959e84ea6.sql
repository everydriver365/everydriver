ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS cancellation_note text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;