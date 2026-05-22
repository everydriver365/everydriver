CREATE TABLE public.mtd_deadline_reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES public.mtd_quarterly_periods(id) ON DELETE CASCADE,
  tier int NOT NULL CHECK (tier IN (30, 7, 1)),
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_ok boolean NOT NULL,
  detail text,
  UNIQUE (period_id, tier)
);

CREATE INDEX idx_mtd_deadline_reminders_sent_period ON public.mtd_deadline_reminders_sent (period_id);

ALTER TABLE public.mtd_deadline_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor reads own reminder log"
ON public.mtd_deadline_reminders_sent
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mtd_quarterly_periods p
    WHERE p.id = period_id
      AND p.instructor_id = public.get_instructor_id_for_user(auth.uid())
  )
);

CREATE POLICY "Admins read all reminder logs"
ON public.mtd_deadline_reminders_sent
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));