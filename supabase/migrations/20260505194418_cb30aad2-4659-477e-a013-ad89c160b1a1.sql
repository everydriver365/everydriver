
CREATE TABLE public.phone_tracking_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  pupil_id uuid,
  event_type text NOT NULL CHECK (event_type IN (
    'permission_changed','tracking_started','tracking_stopped'
  )),
  status text,
  details jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX phone_tracking_audit_instructor_idx
  ON public.phone_tracking_audit(instructor_id, created_at DESC);

CREATE INDEX phone_tracking_audit_created_idx
  ON public.phone_tracking_audit(created_at DESC);

ALTER TABLE public.phone_tracking_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own phone tracking audit"
ON public.phone_tracking_audit
FOR SELECT
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert own phone tracking audit"
ON public.phone_tracking_audit
FOR INSERT
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins view all phone tracking audit"
ON public.phone_tracking_audit
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
