
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS custom_domain_verification_token text,
  ADD COLUMN IF NOT EXISTS custom_domain_dns_status text NOT NULL DEFAULT 'pending'
    CHECK (custom_domain_dns_status IN ('pending','verified','failed')),
  ADD COLUMN IF NOT EXISTS custom_domain_ssl_status text NOT NULL DEFAULT 'pending'
    CHECK (custom_domain_ssl_status IN ('pending','ready','failed')),
  ADD COLUMN IF NOT EXISTS custom_domain_last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS custom_domain_added_at timestamptz,
  ADD COLUMN IF NOT EXISTS custom_domain_status_message text;

CREATE OR REPLACE FUNCTION public.generate_domain_verification_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := 'lovable_';
  i int;
BEGIN
  FOR i IN 1..24 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
