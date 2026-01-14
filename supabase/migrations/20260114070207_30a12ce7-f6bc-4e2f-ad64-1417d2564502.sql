-- Create instructor_subscriptions table
CREATE TABLE public.instructor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own subscription
CREATE POLICY "Instructors can view own subscription"
ON public.instructor_subscriptions
FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON public.instructor_subscriptions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_instructor_subscriptions_updated_at
BEFORE UPDATE ON public.instructor_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();