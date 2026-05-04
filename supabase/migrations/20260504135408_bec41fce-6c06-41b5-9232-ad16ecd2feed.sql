
-- 1) Extend famulor_settings with per-channel toggles + IDs
ALTER TABLE public.famulor_settings
  ADD COLUMN IF NOT EXISTS phone_inbound_enabled  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_outbound_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webchat_enabled        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_agent_id      text,
  ADD COLUMN IF NOT EXISTS webchat_agent_id       text,
  ADD COLUMN IF NOT EXISTS webchat_widget_token   text,
  ADD COLUMN IF NOT EXISTS auto_confirm_bookings  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS per_channel_status     jsonb   NOT NULL DEFAULT '{}'::jsonb;

-- Backfill from existing flags
UPDATE public.famulor_settings
   SET phone_inbound_enabled = inbound_answering_enabled
 WHERE phone_inbound_enabled = false AND inbound_answering_enabled = true;

UPDATE public.famulor_settings
   SET phone_outbound_enabled = true
 WHERE phone_outbound_enabled = false
   AND enabled = true
   AND outbound_agent_id IS NOT NULL
   AND outbound_agent_id <> '';

-- Unique index for webchat embed token lookups
CREATE UNIQUE INDEX IF NOT EXISTS famulor_settings_webchat_widget_token_key
  ON public.famulor_settings(webchat_widget_token)
  WHERE webchat_widget_token IS NOT NULL;

-- 2) Add channel column to call logs (drives unified inbox)
ALTER TABLE public.famulor_call_logs
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'phone';

ALTER TABLE public.famulor_call_logs
  DROP CONSTRAINT IF EXISTS famulor_call_logs_channel_check;
ALTER TABLE public.famulor_call_logs
  ADD CONSTRAINT famulor_call_logs_channel_check
  CHECK (channel IN ('phone','whatsapp','webchat'));

CREATE INDEX IF NOT EXISTS famulor_call_logs_channel_idx
  ON public.famulor_call_logs(instructor_id, channel, created_at DESC);

-- 3) AI booking requests
CREATE TABLE IF NOT EXISTS public.ai_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  source_channel text NOT NULL CHECK (source_channel IN ('phone_in','phone_out','whatsapp','webchat')),
  source_call_log_id uuid REFERENCES public.famulor_call_logs(id) ON DELETE SET NULL,
  pupil_id uuid REFERENCES public.pupils(id) ON DELETE SET NULL,
  contact_name text,
  contact_phone text,
  contact_email text,
  requested_start timestamptz NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 30 AND 480),
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','declined','expired','countered')),
  decided_at timestamptz,
  resulting_lesson_id uuid REFERENCES public.scheduled_lessons(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_booking_requests_instructor_idx
  ON public.ai_booking_requests(instructor_id, status, created_at DESC);

ALTER TABLE public.ai_booking_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors manage own AI booking requests" ON public.ai_booking_requests;
CREATE POLICY "Instructors manage own AI booking requests"
  ON public.ai_booking_requests
  FOR ALL
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "School owners view AI booking requests" ON public.ai_booking_requests;
CREATE POLICY "School owners view AI booking requests"
  ON public.ai_booking_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.school_instructors si
    JOIN public.schools s ON s.id = si.school_id
    WHERE si.instructor_id = ai_booking_requests.instructor_id
      AND s.owner_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins view all AI booking requests" ON public.ai_booking_requests;
CREATE POLICY "Admins view all AI booking requests"
  ON public.ai_booking_requests
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins update all AI booking requests" ON public.ai_booking_requests;
CREATE POLICY "Admins update all AI booking requests"
  ON public.ai_booking_requests
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS ai_booking_requests_updated_at ON public.ai_booking_requests;
CREATE TRIGGER ai_booking_requests_updated_at
  BEFORE UPDATE ON public.ai_booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
