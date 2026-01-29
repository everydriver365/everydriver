-- Drop the existing trigger function and recreate with longer timeout
-- The issue is pg_net has a 5 second default timeout which is too short

-- First, let's create a background jobs table to queue sync requests
CREATE TABLE IF NOT EXISTS public.calendar_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('syncLesson', 'deleteLesson')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error TEXT
);

-- Enable RLS
ALTER TABLE public.calendar_sync_queue ENABLE ROW LEVEL SECURITY;

-- Service role policy for queue processing
CREATE POLICY "Service role can manage queue" ON public.calendar_sync_queue
  FOR ALL USING (true);

-- Update the trigger function to just insert into the queue (instant, no HTTP call)
CREATE OR REPLACE FUNCTION public.trigger_calendar_sync()
RETURNS TRIGGER AS $$
DECLARE
  instructor_id_val UUID;
  lesson_id_val UUID;
  action_type TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    instructor_id_val := OLD.instructor_id;
    lesson_id_val := OLD.id;
    action_type := 'deleteLesson';
  ELSE
    instructor_id_val := NEW.instructor_id;
    lesson_id_val := NEW.id;
    action_type := 'syncLesson';
  END IF;

  -- Insert into sync queue instead of making HTTP call
  INSERT INTO public.calendar_sync_queue (instructor_id, lesson_id, action)
  VALUES (instructor_id_val, lesson_id_val, action_type);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;