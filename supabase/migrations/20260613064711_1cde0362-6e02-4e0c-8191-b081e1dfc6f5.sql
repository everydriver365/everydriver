CREATE OR REPLACE FUNCTION public.get_my_pupil_portal_branding(_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  email text,
  logo_url text,
  brand_colour text,
  secondary_colour text,
  pupil_app_dark_mode boolean,
  pupil_app_enabled boolean,
  profile_image_url text,
  reflective_logs_enabled boolean,
  pupil_self_booking_enabled boolean,
  lesson_feedback_enabled boolean,
  share_lesson_notes_with_pupil boolean,
  payment_qr_url text,
  payment_qr_url_pupil_pays text,
  payment_qr_url_instructor_pays text,
  payment_link_base_url text,
  commission_payer text,
  commission_split_percent numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.name,
    i.phone,
    i.email,
    i.logo_url,
    i.brand_colour,
    i.secondary_colour,
    i.pupil_app_dark_mode,
    i.pupil_app_enabled,
    i.profile_image_url,
    i.reflective_logs_enabled,
    i.pupil_self_booking_enabled,
    i.lesson_feedback_enabled,
    i.share_lesson_notes_with_pupil,
    i.payment_qr_url,
    i.payment_qr_url_pupil_pays,
    i.payment_qr_url_instructor_pays,
    i.payment_link_base_url,
    i.commission_payer,
    i.commission_split_percent
  FROM public.instructors i
  JOIN public.pupils p ON p.instructor_id = i.id
  WHERE i.app_slug = _slug
    AND i.pupil_app_enabled = true
    AND p.auth_user_id = auth.uid()
    AND p.deleted_at IS NULL
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_my_pupil_portal_branding(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_pupil_portal_branding(text) TO service_role;