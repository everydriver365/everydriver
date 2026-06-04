CREATE OR REPLACE FUNCTION public.submit_booking_enquiry(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_instructor_id uuid;
BEGIN
  v_instructor_id := NULLIF(p_payload->>'instructor_id','')::uuid;
  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'instructor_id is required';
  END IF;
  IF COALESCE(trim(p_payload->>'pupil_name'),'') = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF COALESCE(trim(p_payload->>'pupil_email'),'') = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF COALESCE(trim(p_payload->>'pupil_phone'),'') = '' THEN
    RAISE EXCEPTION 'Phone is required';
  END IF;

  INSERT INTO public.booking_enquiries (
    instructor_id, pupil_name, pupil_email, pupil_phone, pupil_postcode,
    course_name, course_hours, message, source, source_page
  ) VALUES (
    v_instructor_id,
    trim(p_payload->>'pupil_name'),
    lower(trim(p_payload->>'pupil_email')),
    trim(p_payload->>'pupil_phone'),
    NULLIF(trim(COALESCE(p_payload->>'pupil_postcode','')),''),
    NULLIF(p_payload->>'course_name',''),
    NULLIF(p_payload->>'course_hours','')::int,
    NULLIF(p_payload->>'message',''),
    COALESCE(NULLIF(p_payload->>'source',''),'mini_website'),
    NULLIF(p_payload->>'source_page','')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_booking_enquiry(jsonb) TO anon, authenticated;