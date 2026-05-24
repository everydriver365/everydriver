ALTER TABLE public.instructor_reminder_preferences
  ADD COLUMN IF NOT EXISTS payment_chase_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_chase_after_days integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS payment_chase_interval_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS payment_chase_max_reminders integer NOT NULL DEFAULT 3;