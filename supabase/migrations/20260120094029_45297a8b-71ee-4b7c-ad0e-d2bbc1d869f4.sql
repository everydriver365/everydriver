-- Add custom_domain column to instructors for storing connected domain from domain_orders
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Add custom_domain_verified column to track verification status
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;

-- Add mini_website_domain_id to link to the domain order
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS mini_website_domain_id UUID REFERENCES public.domain_orders(id);

-- Add dns_records column to domain_orders for storing DNS configuration
ALTER TABLE public.domain_orders 
ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT '[]'::jsonb;

-- Add mini_website_linked column to domain_orders
ALTER TABLE public.domain_orders 
ADD COLUMN IF NOT EXISTS mini_website_linked BOOLEAN DEFAULT FALSE;