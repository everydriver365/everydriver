-- Update subscription_plans with the new plan structure
-- First, update existing plans
UPDATE subscription_plans SET 
  name = 'Free',
  slug = 'free',
  price_monthly = 0,
  price_yearly = 0,
  max_pupils = 5,
  sms_credits_monthly = 0,
  features = '["diary", "basic_pupil_management", "mini_website"]'::jsonb,
  display_order = 1
WHERE slug = 'free';

UPDATE subscription_plans SET 
  name = 'Pro',
  slug = 'pro',
  price_monthly = 29,
  price_yearly = 290,
  max_pupils = 50,
  sms_credits_monthly = 100,
  features = '["diary", "pupil_management", "mini_website", "sms_notifications", "payment_tracking", "telematics"]'::jsonb,
  display_order = 2
WHERE slug = 'pro';

UPDATE subscription_plans SET 
  name = 'Max',
  slug = 'max',
  price_monthly = 49,
  price_yearly = 490,
  max_pupils = NULL,
  sms_credits_monthly = 500,
  features = '["diary", "pupil_management", "mini_website", "sms_notifications", "payment_tracking", "telematics", "expense_tracking", "priority_support", "custom_branding"]'::jsonb,
  display_order = 3
WHERE slug = 'business';

-- Insert new plans: Multi and Enterprise
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, max_pupils, sms_credits_monthly, features, display_order, is_active)
VALUES 
  ('Multi', 'multi', 99, 990, NULL, 1000, '["all_max_features", "multi_instructor", "fleet_management", "shared_diary", "team_analytics"]'::jsonb, 4, true),
  ('Enterprise', 'enterprise', 199, 1990, NULL, 5000, '["all_multi_features", "dedicated_support", "api_access", "white_label", "custom_integrations", "sla_guarantee"]'::jsonb, 5, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_pupils = EXCLUDED.max_pupils,
  sms_credits_monthly = EXCLUDED.sms_credits_monthly,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;