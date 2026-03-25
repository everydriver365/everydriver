ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS billing_interval_months integer NOT NULL DEFAULT 1;

UPDATE subscription_plans SET billing_interval_months = 12 
WHERE name ILIKE '%annual%' OR name ILIKE '%yearly%';