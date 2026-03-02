ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS drive_time_alerts_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quotes_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS intake_questions_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pricing_rules_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS broadcast_messaging_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS lesson_feedback_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reflective_logs_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pupil_self_booking_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_analytics_enabled BOOLEAN DEFAULT true;