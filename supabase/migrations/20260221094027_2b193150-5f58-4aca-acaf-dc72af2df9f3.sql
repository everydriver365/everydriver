-- Add self-service cancel/reschedule settings to instructor_booking_settings
ALTER TABLE public.instructor_booking_settings
  ADD COLUMN IF NOT EXISTS allow_self_cancel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_self_reschedule boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel_notice_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS reschedule_notice_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS allow_extra_hours_request boolean NOT NULL DEFAULT false;

-- Update max_advance_days default to 56 (8 weeks) for new entries
ALTER TABLE public.instructor_booking_settings ALTER COLUMN max_advance_days SET DEFAULT 56;

-- Add cancelled_by and cancelled_reason to scheduled_lessons for tracking self-service cancellations
ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS cancelled_by text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS original_lesson_id uuid;