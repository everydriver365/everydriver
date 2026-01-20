-- Add SSL status columns to domain_orders
ALTER TABLE public.domain_orders 
ADD COLUMN IF NOT EXISTS ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'provisioning', 'active', 'failed', 'expired'));

ALTER TABLE public.domain_orders 
ADD COLUMN IF NOT EXISTS ssl_provisioned_at TIMESTAMPTZ;

ALTER TABLE public.domain_orders 
ADD COLUMN IF NOT EXISTS ssl_expires_at TIMESTAMPTZ;