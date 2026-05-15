CREATE OR REPLACE FUNCTION public.update_public_test_swap_signup(
  p_id uuid,
  p_payload jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.public_test_swap_signups%ROWTYPE;
BEGIN
  SELECT * INTO v_existing FROM public.public_test_swap_signups WHERE id = p_id;
  IF v_existing.id IS NULL THEN
    RAISE EXCEPTION 'Signup not found';
  END IF;

  -- Require email match as a lightweight ownership check
  IF lower(coalesce(p_payload->>'email','')) <> lower(v_existing.email) THEN
    RAISE EXCEPTION 'Email does not match the original registration';
  END IF;

  IF coalesce((p_payload->>'consent_given')::boolean, false) <> true THEN
    RAISE EXCEPTION 'Consent is required';
  END IF;

  UPDATE public.public_test_swap_signups SET
    full_name = coalesce(p_payload->>'full_name', full_name),
    phone = coalesce(p_payload->>'phone', phone),
    current_centre_id = nullif(p_payload->>'current_centre_id','')::uuid,
    current_centre_name = nullif(p_payload->>'current_centre_name',''),
    current_test_date = nullif(p_payload->>'current_test_date','')::date,
    current_test_time = nullif(p_payload->>'current_test_time','')::time,
    has_test_booked = coalesce((p_payload->>'has_test_booked')::boolean, has_test_booked),
    earliest_new_date = nullif(p_payload->>'earliest_new_date','')::date,
    latest_new_date = nullif(p_payload->>'latest_new_date','')::date,
    notes = nullif(p_payload->>'notes',''),
    updated_at = now()
  WHERE id = p_id;

  RETURN p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_public_test_swap_signup(uuid, jsonb) TO anon, authenticated;