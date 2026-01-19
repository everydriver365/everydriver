-- Create instructor_manual_blocks table for personal appointments/blocked time
CREATE TABLE public.instructor_manual_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'personal',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_manual_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for instructor access
CREATE POLICY "Instructors can view their own blocks"
ON public.instructor_manual_blocks
FOR SELECT
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can create their own blocks"
ON public.instructor_manual_blocks
FOR INSERT
WITH CHECK (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can update their own blocks"
ON public.instructor_manual_blocks
FOR UPDATE
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can delete their own blocks"
ON public.instructor_manual_blocks
FOR DELETE
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_instructor_manual_blocks_updated_at
BEFORE UPDATE ON public.instructor_manual_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_instructor_manual_blocks_instructor_datetime 
ON public.instructor_manual_blocks(instructor_id, start_datetime, end_datetime);