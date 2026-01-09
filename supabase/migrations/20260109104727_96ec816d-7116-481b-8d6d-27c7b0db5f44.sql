-- Create lesson history table
CREATE TABLE public.lesson_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id),
  lesson_date DATE NOT NULL,
  start_time TIME WITHOUT TIME ZONE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  skills_practiced TEXT[] DEFAULT '{}',
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Lesson history is publicly viewable"
ON public.lesson_history
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert lesson history"
ON public.lesson_history
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update lesson history"
ON public.lesson_history
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete lesson history"
ON public.lesson_history
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_lesson_history_updated_at
BEFORE UPDATE ON public.lesson_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_lesson_history_pupil_id ON public.lesson_history(pupil_id);
CREATE INDEX idx_lesson_history_lesson_date ON public.lesson_history(lesson_date DESC);