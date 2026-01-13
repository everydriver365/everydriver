-- Create payment link tracking table
CREATE TABLE public.payment_link_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  link_code TEXT NOT NULL UNIQUE,
  amount_requested NUMERIC NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_via TEXT NOT NULL DEFAULT 'sms',
  opened_at TIMESTAMP WITH TIME ZONE NULL,
  opened_count INTEGER NOT NULL DEFAULT 0,
  paid_at TIMESTAMP WITH TIME ZONE NULL,
  paid_amount NUMERIC NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_link_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Instructors can view their payment links"
ON public.payment_link_tracking
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert payment links"
ON public.payment_link_tracking
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update payment links"
ON public.payment_link_tracking
FOR UPDATE
USING (true);

-- Add payment_link_url field to instructors if not exists
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT NULL,
ADD COLUMN IF NOT EXISTS payment_link_base_url TEXT NULL;

-- Create index for faster lookups
CREATE INDEX idx_payment_link_tracking_link_code ON public.payment_link_tracking(link_code);
CREATE INDEX idx_payment_link_tracking_instructor ON public.payment_link_tracking(instructor_id);