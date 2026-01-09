-- Table to store instructor Google Calendar OAuth tokens
CREATE TABLE public.instructor_calendar_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id)
);

-- Table to track calendar events synced to Google
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'lesson',
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id)
);

-- Enable RLS
ALTER TABLE public.instructor_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for instructor_calendar_tokens
CREATE POLICY "Instructors can view their own tokens"
  ON public.instructor_calendar_tokens FOR SELECT
  USING (true);

CREATE POLICY "Instructors can insert their own tokens"
  ON public.instructor_calendar_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Instructors can update their own tokens"
  ON public.instructor_calendar_tokens FOR UPDATE
  USING (true);

CREATE POLICY "Instructors can delete their own tokens"
  ON public.instructor_calendar_tokens FOR DELETE
  USING (true);

-- RLS policies for calendar_events
CREATE POLICY "Instructors can view their own events"
  ON public.calendar_events FOR SELECT
  USING (true);

CREATE POLICY "Instructors can insert their own events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Instructors can delete their own events"
  ON public.calendar_events FOR DELETE
  USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_instructor_calendar_tokens_updated_at
  BEFORE UPDATE ON public.instructor_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();