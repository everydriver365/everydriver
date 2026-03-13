
ALTER TABLE public.pupils 
ADD COLUMN parent_portal_enabled boolean NOT NULL DEFAULT true;

-- Update the update_pupil_profile function to allow parent_portal_enabled
CREATE OR REPLACE FUNCTION public.update_pupil_profile(p_pupil_id uuid, p_updates jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  allowed_fields TEXT[] := ARRAY['profile_image_url','date_of_birth','driver_number','theory_cert_number','phone','email','address','postcode','pickup_address','what3words','parent_portal_enabled'];
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
        WHEN 'parent_portal_enabled' THEN 'BOOLEAN'
        ELSE 'TEXT'
      END
    ), ', ')
    FROM jsonb_each(clean_updates))
  ) USING p_pupil_id, clean_updates;

  RETURN TRUE;
END;
$function$;
