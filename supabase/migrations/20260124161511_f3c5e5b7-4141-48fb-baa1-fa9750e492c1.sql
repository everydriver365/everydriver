-- Create pupil_assignments table to track lesson assignments
CREATE TABLE public.pupil_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL DEFAULT 'practice', -- 'practice', 'theory', 'observation', 'manoeuvre'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pupil_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for instructors
CREATE POLICY "Instructors can view their pupil assignments"
ON public.pupil_assignments FOR SELECT
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create assignments for their pupils"
ON public.pupil_assignments FOR INSERT
WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their pupil assignments"
ON public.pupil_assignments FOR UPDATE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete their pupil assignments"
ON public.pupil_assignments FOR DELETE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_pupil_assignments_pupil_id ON public.pupil_assignments(pupil_id);
CREATE INDEX idx_pupil_assignments_instructor_id ON public.pupil_assignments(instructor_id);
CREATE INDEX idx_pupil_assignments_status ON public.pupil_assignments(status);

-- Add trigger for updated_at
CREATE TRIGGER update_pupil_assignments_updated_at
BEFORE UPDATE ON public.pupil_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a test pupil (using existing instructor)
INSERT INTO public.pupils (
  instructor_id,
  name,
  address,
  postcode,
  email,
  phone,
  course_type,
  lessons_completed,
  progress,
  drive_coins,
  current_streak,
  total_trips,
  weekly_driving_score,
  total_distance_km,
  total_driving_minutes
) VALUES (
  'c9843b58-6edb-4b97-8238-65d725e30aea',
  'Test Pupil - Sarah Johnson',
  '123 Test Street',
  'SW1A 1AA',
  'sarah.test@example.com',
  '07700900123',
  'Standard Course',
  5,
  35,
  150,
  3,
  5,
  78.5,
  45.2,
  180
);

-- Enable realtime for assignments
ALTER PUBLICATION supabase_realtime ADD TABLE public.pupil_assignments;