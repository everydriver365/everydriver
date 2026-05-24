
CREATE TABLE IF NOT EXISTS public.broadcast_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  message text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  template_id uuid REFERENCES public.broadcast_templates(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS broadcast_log_instructor_sent_idx
  ON public.broadcast_log (instructor_id, sent_at DESC);

ALTER TABLE public.broadcast_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can read own broadcast log"
  ON public.broadcast_log
  FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins can read all broadcast log"
  ON public.broadcast_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
