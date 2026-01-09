-- Create a scheduled_lessons table for upcoming booked lessons
CREATE TABLE public.scheduled_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  lesson_date DATE NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  lesson_type TEXT NOT NULL DEFAULT 'Standard Lesson',
  pickup_location TEXT,
  pickup_postcode TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  payment_status TEXT NOT NULL DEFAULT 'not_paid',
  prepaid_hours_used NUMERIC(4,2) DEFAULT 0,
  amount_due NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment/credit tracking to pupils table
ALTER TABLE public.pupils 
ADD COLUMN IF NOT EXISTS prepaid_hours NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_balance NUMERIC(10,2) DEFAULT 0;

-- Enable RLS on scheduled_lessons
ALTER TABLE public.scheduled_lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scheduled_lessons
CREATE POLICY "Scheduled lessons are publicly viewable" 
ON public.scheduled_lessons 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert scheduled lessons" 
ON public.scheduled_lessons 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update scheduled lessons" 
ON public.scheduled_lessons 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete scheduled lessons" 
ON public.scheduled_lessons 
FOR DELETE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_scheduled_lessons_instructor ON public.scheduled_lessons(instructor_id);
CREATE INDEX idx_scheduled_lessons_date ON public.scheduled_lessons(lesson_date);
CREATE INDEX idx_scheduled_lessons_pupil ON public.scheduled_lessons(pupil_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scheduled_lessons_updated_at
BEFORE UPDATE ON public.scheduled_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();