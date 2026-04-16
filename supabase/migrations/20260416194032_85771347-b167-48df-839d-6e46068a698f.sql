-- Course proposals: planner drafts created by instructors or public visitors
CREATE TABLE public.course_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  -- Lead info (used when there's no pupil record yet)
  lead_name TEXT,
  lead_email TEXT,
  lead_phone TEXT,
  lead_postcode TEXT,
  -- Test target
  test_date DATE,
  test_time TIME,
  test_centre_name TEXT,
  -- Course params
  hours_remaining NUMERIC NOT NULL DEFAULT 0,
  lesson_length_minutes INTEGER NOT NULL DEFAULT 120,
  lessons_per_week INTEGER NOT NULL DEFAULT 2,
  -- Weekly availability and generated output
  weekly_availability JSONB NOT NULL DEFAULT '{}'::jsonb,
  pattern_summary JSONB,
  generated_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  feasible BOOLEAN NOT NULL DEFAULT true,
  shortfall_hours NUMERIC DEFAULT 0,
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','converted','dismissed')),
  source TEXT NOT NULL DEFAULT 'instructor_app' CHECK (source IN ('instructor_app','mini_website','drive365')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_proposals_instructor ON public.course_proposals(instructor_id);
CREATE INDEX idx_course_proposals_status ON public.course_proposals(status);
CREATE INDEX idx_course_proposals_test_date ON public.course_proposals(test_date);

ALTER TABLE public.course_proposals ENABLE ROW LEVEL SECURITY;

-- Instructors manage their own proposals
CREATE POLICY "Instructors view own proposals"
  ON public.course_proposals FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert own proposals"
  ON public.course_proposals FOR INSERT
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update own proposals"
  ON public.course_proposals FOR UPDATE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors delete own proposals"
  ON public.course_proposals FOR DELETE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Public can submit new proposals (mini-site + Drive365 lead capture).
-- They cannot select, update or delete.
CREATE POLICY "Public can submit proposals"
  ON public.course_proposals FOR INSERT
  TO anon
  WITH CHECK (status = 'draft' AND source IN ('mini_website','drive365'));

-- Trigger to maintain updated_at
CREATE TRIGGER set_course_proposals_updated_at
  BEFORE UPDATE ON public.course_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();