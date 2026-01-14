-- Create table for domain orders
CREATE TABLE public.domain_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  tld TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('domain', 'hosting', 'bundle')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  godaddy_order_id TEXT,
  price_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  period_years INTEGER NOT NULL DEFAULT 1,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.domain_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Instructors can view their own domain orders"
ON public.domain_orders
FOR SELECT
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create domain orders"
ON public.domain_orders
FOR INSERT
WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own domain orders"
ON public.domain_orders
FOR UPDATE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Create trigger for timestamps
CREATE TRIGGER update_domain_orders_updated_at
BEFORE UPDATE ON public.domain_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_domain_orders_instructor ON public.domain_orders(instructor_id);
CREATE INDEX idx_domain_orders_status ON public.domain_orders(status);