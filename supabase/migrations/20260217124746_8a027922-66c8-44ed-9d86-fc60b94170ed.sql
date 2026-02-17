
ALTER TABLE public.subscription_plans ADD COLUMN payout_speed text DEFAULT '24 hours';

UPDATE public.subscription_plans SET payout_speed = '24 hours' WHERE slug IN ('free', 'pro');
UPDATE public.subscription_plans SET payout_speed = 'Instant' WHERE slug IN ('max', 'multi', 'enterprise');
