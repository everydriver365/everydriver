
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS enabled_features JSONB NOT NULL DEFAULT '{
  "courses": true,
  "bnpl": true,
  "payment-gateways": true,
  "fleet": true,
  "payroll": true,
  "test-results": true,
  "booking-page": true,
  "branding": true,
  "notifications": true,
  "calendar": true,
  "reports": true
}'::jsonb;
