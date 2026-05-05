
CREATE TABLE public.phone_tracking_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  pupil_id uuid,
  status text NOT NULL CHECK (status IN ('granted','denied','prompt','unavailable','unknown')),
  granted_at timestamptz,
  denied_at timestamptz,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX phone_tracking_permissions_unique
  ON public.phone_tracking_permissions(instructor_id, COALESCE(pupil_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE TRIGGER phone_tracking_permissions_set_updated_at
BEFORE UPDATE ON public.phone_tracking_permissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.phone_tracking_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own phone permissions"
ON public.phone_tracking_permissions
FOR SELECT
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors modify own phone permissions"
ON public.phone_tracking_permissions
FOR ALL
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));
