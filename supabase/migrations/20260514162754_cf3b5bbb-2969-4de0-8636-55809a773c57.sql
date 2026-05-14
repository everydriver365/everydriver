ALTER TABLE public.booking_enquiries
  ADD COLUMN IF NOT EXISTS source_page text,
  ADD COLUMN IF NOT EXISTS instructor_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS instructor_email_error text,
  ADD COLUMN IF NOT EXISTS admin_email_error text;

ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS typical_response_hours integer;

-- Allow service-role updates from edge functions to write back email status
-- (existing UPDATE policy is restricted to instructor; service role bypasses RLS,
--  so no extra policy needed).