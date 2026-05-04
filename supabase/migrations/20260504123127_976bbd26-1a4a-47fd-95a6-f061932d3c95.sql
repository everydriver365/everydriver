
-- Famulor settings (one per instructor)
CREATE TABLE public.famulor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL UNIQUE REFERENCES public.instructors(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  inbound_agent_id TEXT,
  outbound_agent_id TEXT,
  inbound_phone_number TEXT,
  voice_id TEXT,
  business_hours_only BOOLEAN NOT NULL DEFAULT true,
  auto_book_enabled BOOLEAN NOT NULL DEFAULT false,
  reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  dormant_winback_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_hours_before INTEGER NOT NULL DEFAULT 24,
  dormant_days_threshold INTEGER NOT NULL DEFAULT 60,
  daily_call_cap INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.famulor_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own famulor settings"
ON public.famulor_settings
FOR ALL
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER famulor_settings_updated_at
BEFORE UPDATE ON public.famulor_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Famulor call logs
CREATE TABLE public.famulor_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  lead_id UUID,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  purpose TEXT NOT NULL CHECK (purpose IN ('receptionist','reminder','win_back','test','custom')),
  famulor_call_id TEXT,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','in_progress','completed','failed','no_answer')),
  duration_seconds INTEGER,
  transcript JSONB,
  summary TEXT,
  outcome TEXT,
  recording_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.famulor_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own famulor call logs"
ON public.famulor_call_logs
FOR SELECT
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert own famulor call logs"
ON public.famulor_call_logs
FOR INSERT
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update own famulor call logs"
ON public.famulor_call_logs
FOR UPDATE
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors delete own famulor call logs"
ON public.famulor_call_logs
FOR DELETE
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE INDEX idx_famulor_logs_instructor_created
  ON public.famulor_call_logs (instructor_id, created_at DESC);

CREATE INDEX idx_famulor_logs_call_id
  ON public.famulor_call_logs (famulor_call_id);

CREATE INDEX idx_famulor_logs_pupil
  ON public.famulor_call_logs (pupil_id);
