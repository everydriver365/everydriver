
-- Add commission rate fields to subscription_plans
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS commission_rate_percent numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS commission_fixed_pence integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.subscription_plans.commission_rate_percent IS 'Platform commission percentage charged per card payment on this plan';
COMMENT ON COLUMN public.subscription_plans.commission_fixed_pence IS 'Fixed fee in pence charged per card payment on this plan';
