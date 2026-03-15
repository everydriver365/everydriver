
-- Feature 1: Waiting List Entries (public-facing waitlist)
CREATE TABLE public.waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  preferred_days TEXT[] DEFAULT '{}',
  preferred_times TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert waitlist entries" ON public.waitlist_entries
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Instructors can manage their waitlist entries" ON public.waitlist_entries
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Feature 2: Schools & School Instructors
CREATE TYPE public.school_role AS ENUM ('school_owner', 'school_admin', 'instructor');

CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  logo_url TEXT,
  brand_colour TEXT DEFAULT '#1a1a2e',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.school_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  role public.school_role NOT NULL DEFAULT 'instructor',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, instructor_id)
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School owners can manage their schools" ON public.schools
  FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "School members can view their school" ON public.schools
  FOR SELECT TO authenticated
  USING (id IN (SELECT school_id FROM public.school_instructors si JOIN public.instructors i ON si.instructor_id = i.id WHERE i.auth_user_id = auth.uid()));

CREATE POLICY "School owners can manage school instructors" ON public.school_instructors
  FOR ALL TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "Instructors can view their own school membership" ON public.school_instructors
  FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Feature 4: Instructor Reports
CREATE TABLE public.instructor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  pdf_url TEXT,
  parameters JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their reports" ON public.instructor_reports
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Feature 5: Availability Rules
CREATE TYPE public.availability_rule_type AS ENUM ('recurring_exception', 'holiday_block', 'seasonal');

CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  rule_type public.availability_rule_type NOT NULL,
  description TEXT,
  day_of_week INTEGER,
  week_of_month INTEGER,
  start_date DATE,
  end_date DATE,
  is_available BOOLEAN NOT NULL DEFAULT false,
  auto_notify_pupils BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their availability rules" ON public.availability_rules
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Feature 6: Pupil Certificates
CREATE TABLE public.pupil_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  milestone_type TEXT NOT NULL,
  certificate_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pupil_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage pupil certificates" ON public.pupil_certificates
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Anon can view certificates for pupil portal" ON public.pupil_certificates
  FOR SELECT TO anon USING (true);
