ALTER TABLE public.instructor_notification_settings
  ADD COLUMN IF NOT EXISTS message_sound_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS message_sound_choice text NOT NULL DEFAULT 'chime'
    CHECK (message_sound_choice IN ('chime','ding','pop','none'));