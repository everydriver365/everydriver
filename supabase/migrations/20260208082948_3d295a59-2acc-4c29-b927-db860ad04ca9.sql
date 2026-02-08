
-- Platform commission config (global settings)
CREATE TABLE public.platform_commission_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_type TEXT NOT NULL DEFAULT 'payment', -- 'payment' or 'subscription'
  rate_percent NUMERIC NOT NULL DEFAULT 2.5,
  fixed_fee_pence INTEGER NOT NULL DEFAULT 20,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform commissions log
CREATE TABLE public.platform_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES public.instructors(id),
  source_type TEXT NOT NULL DEFAULT 'payment', -- 'payment' or 'subscription'
  source_id TEXT, -- payment_history id or subscription id
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC,
  fixed_fee NUMERIC,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_commission_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (no auth.uid check - admin portal uses service role or is public-facing admin)
CREATE POLICY "Allow read for all authenticated" ON public.platform_commission_config FOR SELECT USING (true);
CREATE POLICY "Allow read for all authenticated" ON public.platform_commissions FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.platform_commissions FOR INSERT WITH CHECK (true);

-- Seed default config
INSERT INTO public.platform_commission_config (commission_type, rate_percent, fixed_fee_pence)
VALUES ('payment', 2.5, 20), ('subscription', 0, 0);

-- Trigger for updated_at
CREATE TRIGGER set_platform_commission_config_updated_at
  BEFORE UPDATE ON public.platform_commission_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
