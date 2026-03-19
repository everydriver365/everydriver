
-- Add voice_note_url to lesson_history
ALTER TABLE public.lesson_history ADD COLUMN IF NOT EXISTS voice_note_url TEXT;

-- Add churn_risk_score to pupils
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS churn_risk_score INTEGER DEFAULT 0;
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS churn_risk_updated_at TIMESTAMP WITH TIME ZONE;

-- Create voice-notes storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for voice-notes bucket
CREATE POLICY "Instructors can upload voice notes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-notes');

CREATE POLICY "Instructors can read own voice notes" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'voice-notes');

CREATE POLICY "Instructors can delete own voice notes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'voice-notes');

-- Create churn_events table for tracking churn over time
CREATE TABLE IF NOT EXISTS public.churn_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'churned',
  risk_score INTEGER DEFAULT 0,
  reason TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  re_engaged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.churn_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own churn events" ON public.churn_events
FOR ALL TO authenticated
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Create lesson_reminders table
CREATE TABLE IF NOT EXISTS public.lesson_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lesson_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own reminders" ON public.lesson_reminders
FOR ALL TO authenticated
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));
