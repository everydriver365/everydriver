
-- subscription_payments table
CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'pending',
  gocardless_payment_id text,
  payment_date date,
  period_start date,
  period_end date,
  receipt_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can read own subscription payments"
  ON public.subscription_payments
  FOR SELECT
  TO authenticated
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Service role can manage subscription payments"
  ON public.subscription_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- admin_alerts table
CREATE TABLE public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE,
  subscription_id uuid,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read alerts"
  ON public.admin_alerts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alerts"
  ON public.admin_alerts
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage alerts"
  ON public.admin_alerts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
