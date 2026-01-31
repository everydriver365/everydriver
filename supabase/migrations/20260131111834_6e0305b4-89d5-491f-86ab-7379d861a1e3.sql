-- Instructor reminder preferences table for enhanced automated reminders
CREATE TABLE IF NOT EXISTS public.instructor_reminder_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  sms_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  reminder_time time DEFAULT '18:00:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id)
);

-- Enable RLS
ALTER TABLE public.instructor_reminder_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies - instructors table.id = auth.uid() in this system
CREATE POLICY "Instructors can view their own preferences"
ON public.instructor_reminder_preferences
FOR SELECT
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can insert their own preferences"
ON public.instructor_reminder_preferences
FOR INSERT
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can update their own preferences"
ON public.instructor_reminder_preferences
FOR UPDATE
USING (instructor_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_instructor_reminder_preferences_updated_at
BEFORE UPDATE ON public.instructor_reminder_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();