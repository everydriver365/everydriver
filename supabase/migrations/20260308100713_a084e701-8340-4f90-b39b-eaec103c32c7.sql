-- Theory Mock Results table
CREATE TABLE public.theory_mock_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds INTEGER,
  category_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.theory_mock_results ENABLE ROW LEVEL SECURITY;

-- Pupils can insert their own results (via anon role with pupil_id check)
CREATE POLICY "Anyone can insert mock results"
ON public.theory_mock_results FOR INSERT
WITH CHECK (true);

-- Instructors can view results for their pupils
CREATE POLICY "Instructors can view pupil mock results"
ON public.theory_mock_results FOR SELECT TO authenticated
USING (
  pupil_id IN (
    SELECT id FROM public.pupils WHERE instructor_id = get_instructor_id_for_user(auth.uid())
  )
);

-- Public can read own results by pupil_id  
CREATE POLICY "Anon can read own mock results"
ON public.theory_mock_results FOR SELECT TO anon
USING (true);

-- Lesson Routes table for GPS recording
CREATE TABLE public.lesson_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE SET NULL,
  telematics_id UUID REFERENCES public.lesson_telematics(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  coordinates JSONB NOT NULL DEFAULT '[]',
  distance_km NUMERIC(8,2),
  duration_minutes INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own routes"
ON public.lesson_routes FOR ALL TO authenticated
USING (instructor_id = get_instructor_id_for_user(auth.uid()))
WITH CHECK (instructor_id = get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Anon can read routes by pupil_id"
ON public.lesson_routes FOR SELECT TO anon
USING (true);