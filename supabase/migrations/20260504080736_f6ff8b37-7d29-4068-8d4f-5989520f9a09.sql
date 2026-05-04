ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS ai_call_divert_mode text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS ai_call_divert_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_call_divert_buffer_before_minutes integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS ai_call_divert_buffer_after_minutes integer NOT NULL DEFAULT 5;

-- Constrain mode values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'instructors_ai_call_divert_mode_check'
  ) THEN
    ALTER TABLE public.instructors
      ADD CONSTRAINT instructors_ai_call_divert_mode_check
      CHECK (ai_call_divert_mode IN ('off','on_now','auto'));
  END IF;
END $$;