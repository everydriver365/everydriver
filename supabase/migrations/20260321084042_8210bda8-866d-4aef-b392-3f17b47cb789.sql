CREATE TABLE public.geotab_fault_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.gps_devices(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.instructors(id),
  fault_code TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium',
  source TEXT DEFAULT 'geotab',
  detected_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.geotab_fault_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors see own faults" ON public.geotab_fault_codes
  FOR SELECT TO authenticated
  USING (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins see all faults" ON public.geotab_fault_codes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));