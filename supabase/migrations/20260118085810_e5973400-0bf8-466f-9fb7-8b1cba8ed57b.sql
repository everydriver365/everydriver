-- Create table for Google Service Account calendar connections
CREATE TABLE public.instructor_google_service_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instructor_id)
);

-- Enable RLS
ALTER TABLE public.instructor_google_service_calendar ENABLE ROW LEVEL SECURITY;

-- Policy: Instructors can manage their own connection
CREATE POLICY "Instructors manage own google service calendar"
  ON public.instructor_google_service_calendar FOR ALL
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ));

-- Trigger to update updated_at
CREATE TRIGGER update_instructor_google_service_calendar_updated_at
  BEFORE UPDATE ON public.instructor_google_service_calendar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();