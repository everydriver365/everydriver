
-- Create sos_alerts table
CREATE TABLE public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  alert_level text NOT NULL DEFAULT 'call_me',
  latitude numeric,
  longitude numeric,
  what3words text,
  message text,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

-- Instructors can insert their own alerts
CREATE POLICY "Instructors can insert own SOS alerts"
ON public.sos_alerts FOR INSERT TO authenticated
WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Instructors can read their own alerts + SOS-level broadcasts
CREATE POLICY "Instructors can read own and SOS alerts"
ON public.sos_alerts FOR SELECT TO authenticated
USING (
  instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid())
  OR alert_level = 'sos'
  OR public.has_role(auth.uid(), 'admin')
);

-- Admins can update (resolve) alerts
CREATE POLICY "Admins can update SOS alerts"
ON public.sos_alerts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
