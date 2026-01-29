-- Add billing request ID column to track pending GoCardless setups
ALTER TABLE public.instructor_subscriptions 
ADD COLUMN IF NOT EXISTS gocardless_billing_request_id text;