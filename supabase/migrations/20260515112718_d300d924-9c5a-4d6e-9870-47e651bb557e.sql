CREATE OR REPLACE FUNCTION public.submit_public_test_swap_signup(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_consent boolean;
BEGIN
  v_consent := COALESCE((p_payload->>'consent_given')::boolean, false);
  IF v_consent IS NOT TRUE THEN
    RAISE EXCEPTION 'Consent is required to submit a swap signup';
  END IF;

  IF COALESCE(trim(p_payload->>'full_name'), '') = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF COALESCE(trim(p_payload->>'email'), '') = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF COALESCE(trim(p_payload->>'phone'), '') = '' THEN
    RAISE EXCEPTION 'Phone is required';
  END IF;
  IF (p_payload->>'earliest_new_date') IS NULL OR (p_payload->>'latest_new_date') IS NULL THEN
    RAISE EXCEPTION 'Preferred date window is required';
  END IF;

  INSERT INTO public.public_test_swap_signups (
    full_name, email, phone,
    current_centre_id, current_centre_name,
    current_test_date, current_test_time,
    has_test_booked,
    earliest_new_date, latest_new_date,
    alternate_centre_ids,
    notes, consent_given
  ) VALUES (
    trim(p_payload->>'full_name'),
    lower(trim(p_payload->>'email')),
    trim(p_payload->>'phone'),
    NULLIF(p_payload->>'current_centre_id','')::uuid,
    NULLIF(p_payload->>'current_centre_name',''),
    NULLIF(p_payload->>'current_test_date','')::date,
    NULLIF(p_payload->>'current_test_time','')::time,
    COALESCE((p_payload->>'has_test_booked')::boolean, true),
    (p_payload->>'earliest_new_date')::date,
    (p_payload->>'latest_new_date')::date,
    COALESCE(
      (SELECT array_agg(value::uuid) FROM jsonb_array_elements_text(COALESCE(p_payload->'alternate_centre_ids','[]'::jsonb))),
      '{}'::uuid[]
    ),
    NULLIF(p_payload->>'notes',''),
    true
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_test_swap_signup(jsonb) TO anon, authenticated;