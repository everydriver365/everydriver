-- Create parent OTP codes table for SMS verification
CREATE TABLE public.parent_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role access (edge functions use service role)
CREATE POLICY "Service role can manage parent OTP codes"
ON public.parent_otp_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_parent_otp_codes_phone ON public.parent_otp_codes(phone);

-- Add function to cleanup expired parent OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_parent_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.parent_otp_codes WHERE expires_at < now();
END;
$$;