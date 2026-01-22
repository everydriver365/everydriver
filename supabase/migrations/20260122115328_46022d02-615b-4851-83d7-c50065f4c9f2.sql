-- Create table for storing pupil OTP codes
CREATE TABLE public.pupil_otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pupil_otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for edge functions to manage OTP codes (service role only)
CREATE POLICY "Service role can manage OTP codes"
ON public.pupil_otp_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_pupil_otp_phone ON public.pupil_otp_codes(phone);

-- Add a cleanup function to remove expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.pupil_otp_codes WHERE expires_at < now();
END;
$$;