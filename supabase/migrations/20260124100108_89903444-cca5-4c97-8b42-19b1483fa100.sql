-- Add columns to subscription_plans for admin management
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Get Started';

-- Add GoCardless columns to instructor_subscriptions
ALTER TABLE instructor_subscriptions 
ADD COLUMN IF NOT EXISTS gocardless_customer_id TEXT,
ADD COLUMN IF NOT EXISTS gocardless_mandate_id TEXT,
ADD COLUMN IF NOT EXISTS gocardless_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- Update existing plans with descriptions
UPDATE subscription_plans SET description = 'Perfect for getting started' WHERE slug = 'free';
UPDATE subscription_plans SET description = 'For established instructors', is_popular = true WHERE slug = 'pro';
UPDATE subscription_plans SET description = 'For growing driving schools' WHERE slug = 'business';
UPDATE subscription_plans SET description = 'Maximum features for power users' WHERE slug = 'max';
UPDATE subscription_plans SET description = 'Multi-instructor management' WHERE slug = 'multi';
UPDATE subscription_plans SET description = 'Custom solutions for large schools' WHERE slug = 'enterprise';