-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC,
  features JSONB DEFAULT '[]'::jsonb,
  max_pupils INTEGER,
  sms_credits_monthly INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active plans
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- Admins can manage plans
CREATE POLICY "Admins can manage plans"
ON public.subscription_plans
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, features, max_pupils, sms_credits_monthly, display_order) VALUES
('Free', 'free', 0, 0, '["diary", "basic_pupil_management", "mini_website"]'::jsonb, 5, 0, 1),
('Pro', 'pro', 29, 290, '["diary", "pupil_management", "mini_website", "sms_notifications", "payment_tracking", "telematics"]'::jsonb, 50, 100, 2),
('Business', 'business', 49, 490, '["diary", "pupil_management", "mini_website", "sms_notifications", "payment_tracking", "telematics", "expense_tracking", "priority_support", "custom_branding"]'::jsonb, NULL, 500, 3);

-- Add trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();