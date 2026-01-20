-- Create hosting_orders table
CREATE TABLE public.hosting_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled', 'expired')),
  provider_package_ref TEXT,
  price_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  billing_period TEXT NOT NULL DEFAULT 'yearly' CHECK (billing_period IN ('monthly', 'yearly')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on hosting_orders
ALTER TABLE public.hosting_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for hosting_orders
CREATE POLICY "Instructors can view their own hosting orders"
ON public.hosting_orders
FOR SELECT
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can create their own hosting orders"
ON public.hosting_orders
FOR INSERT
WITH CHECK (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can update their own hosting orders"
ON public.hosting_orders
FOR UPDATE
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

-- Add updated_at trigger for hosting_orders
CREATE TRIGGER update_hosting_orders_updated_at
BEFORE UPDATE ON public.hosting_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix domain_orders RLS policies using auth_user_id
DROP POLICY IF EXISTS "Instructors can view their own domain orders" ON public.domain_orders;
DROP POLICY IF EXISTS "Instructors can create their own domain orders" ON public.domain_orders;
DROP POLICY IF EXISTS "Instructors can update their own domain orders" ON public.domain_orders;

CREATE POLICY "Instructors can view their own domain orders"
ON public.domain_orders
FOR SELECT
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can create their own domain orders"
ON public.domain_orders
FOR INSERT
WITH CHECK (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can update their own domain orders"
ON public.domain_orders
FOR UPDATE
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));