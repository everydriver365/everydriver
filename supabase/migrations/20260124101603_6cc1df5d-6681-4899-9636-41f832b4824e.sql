-- Add GoCardless plan ID field to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS gocardless_plan_id TEXT;