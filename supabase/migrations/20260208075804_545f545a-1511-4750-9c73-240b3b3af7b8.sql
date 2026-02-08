
-- Add dual QR code columns and commission payer setting to instructors
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS payment_qr_url_pupil_pays text,
  ADD COLUMN IF NOT EXISTS payment_qr_url_instructor_pays text,
  ADD COLUMN IF NOT EXISTS commission_payer text DEFAULT 'pupil';
