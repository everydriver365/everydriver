
-- School courses table
CREATE TABLE public.school_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  course_hours INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  discounted_price NUMERIC,
  description TEXT,
  features TEXT[],
  course_image_url TEXT,
  is_intensive BOOLEAN NOT NULL DEFAULT false,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.school_courses ENABLE ROW LEVEL SECURITY;

-- School owner helper
CREATE OR REPLACE FUNCTION public.is_school_owner(p_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schools
    WHERE id = p_school_id AND owner_user_id = auth.uid()
  );
$$;

-- RLS for school_courses
CREATE POLICY "Public can read active school courses"
  ON public.school_courses FOR SELECT
  USING (is_active = true);

CREATE POLICY "School owners can manage their courses"
  ON public.school_courses FOR ALL
  TO authenticated
  USING (public.is_school_owner(school_id))
  WITH CHECK (public.is_school_owner(school_id));

-- Timestamp trigger
CREATE TRIGGER update_school_courses_updated_at
  BEFORE UPDATE ON public.school_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Junction table
CREATE TABLE public.school_course_instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_course_id UUID NOT NULL REFERENCES public.school_courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  UNIQUE (school_course_id, instructor_id)
);

ALTER TABLE public.school_course_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read school course instructors"
  ON public.school_course_instructors FOR SELECT
  USING (true);

CREATE POLICY "School owners can manage course instructors"
  ON public.school_course_instructors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.school_courses sc
      WHERE sc.id = school_course_id AND public.is_school_owner(sc.school_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.school_courses sc
      WHERE sc.id = school_course_id AND public.is_school_owner(sc.school_id)
    )
  );

-- Indexes
CREATE INDEX idx_school_courses_school_id ON public.school_courses(school_id);
CREATE INDEX idx_school_course_instructors_course ON public.school_course_instructors(school_course_id);
CREATE INDEX idx_school_course_instructors_instructor ON public.school_course_instructors(instructor_id);
