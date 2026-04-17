ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS auto_start_tracker boolean NOT NULL DEFAULT false;