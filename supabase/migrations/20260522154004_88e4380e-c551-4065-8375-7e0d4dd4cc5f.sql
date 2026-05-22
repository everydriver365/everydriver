CREATE TABLE public.pupil_native_push_bindings (
  pupil_id uuid PRIMARY KEY REFERENCES public.pupils(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ios','android','web-wrapper')),
  permission_granted boolean NOT NULL DEFAULT false,
  user_agent text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pupil_native_push_bindings_last_seen
  ON public.pupil_native_push_bindings (last_seen_at);

ALTER TABLE public.pupil_native_push_bindings ENABLE ROW LEVEL SECURITY;

-- Mirror the public-pupil-portal trust model used by pupil_push_subscriptions:
-- the pupil portal is a branded public route, so anyone can upsert a binding
-- keyed to a real pupil_id. Sensitive sending still goes through the service-role
-- edge function which validates the pupil exists.
CREATE POLICY "Anyone can upsert a pupil native push binding"
  ON public.pupil_native_push_bindings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.pupils p WHERE p.id = pupil_id));

CREATE POLICY "Anyone can update a pupil native push binding"
  ON public.pupil_native_push_bindings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read a pupil native push binding"
  ON public.pupil_native_push_bindings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage pupil native push bindings"
  ON public.pupil_native_push_bindings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pupil_native_push_bindings_updated_at
  BEFORE UPDATE ON public.pupil_native_push_bindings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();