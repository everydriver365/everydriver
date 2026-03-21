CREATE TABLE public.lesson_pedal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telematics_id UUID REFERENCES public.lesson_telematics(id) ON DELETE CASCADE NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  brake_pedal_pct NUMERIC,
  gear_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lesson_pedal_telematics ON public.lesson_pedal_data(telematics_id, recorded_at);

ALTER TABLE public.lesson_pedal_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors see own pedal data" ON public.lesson_pedal_data
  FOR SELECT TO authenticated
  USING (telematics_id IN (
    SELECT id FROM public.lesson_telematics WHERE instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Service role inserts pedal data" ON public.lesson_pedal_data
  FOR INSERT TO authenticated
  WITH CHECK (true);