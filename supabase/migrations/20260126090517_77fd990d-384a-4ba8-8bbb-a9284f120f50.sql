-- Add scheduled_lesson_id column to lesson_history table
-- This allows feedback to be linked to a specific scheduled lesson

ALTER TABLE public.lesson_history 
ADD COLUMN IF NOT EXISTS scheduled_lesson_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lesson_history_scheduled_lesson_id 
ON public.lesson_history(scheduled_lesson_id);

-- Add comment for documentation
COMMENT ON COLUMN public.lesson_history.scheduled_lesson_id IS 'Optional reference to the scheduled lesson this feedback is for';