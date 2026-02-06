
-- Create urgent alerts table
CREATE TABLE public.urgent_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'urgent',
  is_broadcast BOOLEAN NOT NULL DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'admin'
);

-- Enable RLS
ALTER TABLE public.urgent_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can manage urgent alerts
CREATE POLICY "Admins can manage urgent alerts"
  ON public.urgent_alerts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Instructors can view their own alerts or broadcasts
CREATE POLICY "Instructors can view their alerts"
  ON public.urgent_alerts
  FOR SELECT
  TO authenticated
  USING (
    instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid())
    OR is_broadcast = true
  );

-- Instructors can dismiss (update) their own alerts
CREATE POLICY "Instructors can dismiss their alerts"
  ON public.urgent_alerts
  FOR UPDATE
  TO authenticated
  USING (
    instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid())
    OR is_broadcast = true
  )
  WITH CHECK (
    instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid())
    OR is_broadcast = true
  );

-- Enable realtime for instant delivery
ALTER PUBLICATION supabase_realtime ADD TABLE public.urgent_alerts;
