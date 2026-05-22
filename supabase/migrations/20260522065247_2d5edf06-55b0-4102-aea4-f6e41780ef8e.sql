CREATE TABLE IF NOT EXISTS public.account_deletion_reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deletion_request_id uuid NOT NULL REFERENCES public.account_deletion_requests(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('t7','t25','t29')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_ok boolean NOT NULL DEFAULT true,
  detail text,
  UNIQUE (deletion_request_id, kind)
);

ALTER TABLE public.account_deletion_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view deletion reminder log"
  ON public.account_deletion_reminders_sent
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));