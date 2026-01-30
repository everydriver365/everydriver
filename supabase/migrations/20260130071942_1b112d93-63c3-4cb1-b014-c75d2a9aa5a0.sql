-- Add Square-specific columns to instructor_subscriptions
ALTER TABLE public.instructor_subscriptions 
ADD COLUMN IF NOT EXISTS square_customer_id text,
ADD COLUMN IF NOT EXISTS square_subscription_id text,
ADD COLUMN IF NOT EXISTS square_card_id text;

-- Add Square plan variation ID to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS square_plan_variation_id text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_instructor_subscriptions_square_customer 
ON public.instructor_subscriptions(square_customer_id) 
WHERE square_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_instructor_subscriptions_square_subscription 
ON public.instructor_subscriptions(square_subscription_id) 
WHERE square_subscription_id IS NOT NULL;