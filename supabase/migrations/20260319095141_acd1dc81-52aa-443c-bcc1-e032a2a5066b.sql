
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS morning_briefing_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS auto_reengagement_enabled BOOLEAN DEFAULT false;
