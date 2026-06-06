-- 1. Source column on scheduled_lessons
ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'dsm';

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_google_event
  ON public.scheduled_lessons (instructor_id, google_event_id)
  WHERE google_event_id IS NOT NULL;

-- 2. Unmatched Google events
CREATE TABLE IF NOT EXISTS public.unmatched_google_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  title TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  resolved_lesson_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unmatched_google_events_unique UNIQUE (instructor_id, external_event_id),
  CONSTRAINT unmatched_google_events_status_chk CHECK (status IN ('pending','dismissed','resolved'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unmatched_google_events TO authenticated;
GRANT ALL ON public.unmatched_google_events TO service_role;

ALTER TABLE public.unmatched_google_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own unmatched google events"
  ON public.unmatched_google_events
  FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_unmatched_google_events_instructor_status
  ON public.unmatched_google_events (instructor_id, status);

CREATE TRIGGER update_unmatched_google_events_updated_at
  BEFORE UPDATE ON public.unmatched_google_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();