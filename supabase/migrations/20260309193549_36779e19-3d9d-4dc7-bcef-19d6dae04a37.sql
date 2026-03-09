
CREATE OR REPLACE FUNCTION public.update_pupil_profile(p_pupil_id UUID, p_updates JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  allowed_fields TEXT[] := ARRAY['profile_image_url','date_of_birth','driver_number','theory_cert_number','phone','email','address','postcode','pickup_address','what3words'];
  field_name TEXT;
  clean_updates JSONB := '{}'::JSONB;
BEGIN
  FOR field_name IN SELECT jsonb_object_keys(p_updates)
  LOOP
    IF field_name = ANY(allowed_fields) THEN
      clean_updates := clean_updates || jsonb_build_object(field_name, p_updates->field_name);
    END IF;
  END LOOP;

  IF clean_updates = '{}'::JSONB THEN
    RETURN FALSE;
  END IF;

  EXECUTE format(
    'UPDATE public.pupils SET %s WHERE id = $1',
    (SELECT string_agg(format('%I = ($2->>%L)::%s',
      key,
      key,
      CASE key
        WHEN 'date_of_birth' THEN 'DATE'
        ELSE 'TEXT'
      END
    ), ', ')
    FROM jsonb_each(clean_updates))
  ) USING p_pupil_id, clean_updates;

  RETURN TRUE;
END;
$$;
