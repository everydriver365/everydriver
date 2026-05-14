
CREATE TABLE public.webhook_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text,
  event_type text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  response_status int,
  error text,
  signature_valid boolean,
  payload jsonb,
  notes text
);

CREATE INDEX idx_wdl_provider_received ON public.webhook_delivery_log (provider, received_at DESC);
CREATE INDEX idx_wdl_event_id ON public.webhook_delivery_log (provider, event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_wdl_unprocessed ON public.webhook_delivery_log (received_at DESC) WHERE processed = false;

ALTER TABLE public.webhook_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook log"
  ON public.webhook_delivery_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
