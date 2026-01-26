-- Add telematics_session_id column to lesson_history table
-- This allows feedback to be linked to a specific tracking session

ALTER TABLE public.lesson_history 
ADD COLUMN IF NOT EXISTS telematics_session_id UUID REFERENCES public.lesson_telematics(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lesson_history_telematics_session_id 
ON public.lesson_history(telematics_session_id);