
-- =============================================
-- BATCH 3: Create public_instructors view
-- Restrict full instructors table SELECT to owners/admins
-- =============================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Instructors are publicly viewable" ON instructors;

-- Create restricted SELECT: instructor sees own, admin sees all
CREATE POLICY "Instructors can view own profile" ON instructors
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Allow anon to see basic public info via view (we need a policy for anon SELECT on limited fields)
-- We'll use a view with security_invoker = false so it bypasses RLS
CREATE OR REPLACE VIEW public.public_instructors
WITH (security_invoker = false)
AS SELECT
  id,
  name,
  bio,
  profile_image_url,
  car_image_url,
  car_type,
  car_make,
  car_model,
  home_postcode,
  radius_miles,
  hourly_rate,
  is_active,
  special_skills,
  extra_info,
  brand_colour,
  secondary_colour,
  app_slug,
  custom_branding_enabled,
  cpd_certified,
  instructor_grade,
  welcome_video_url,
  logo_url,
  personal_website_url,
  facebook_url,
  instagram_url,
  twitter_url,
  linkedin_url,
  booking_advance_days,
  preferred_lesson_length,
  allowed_lesson_lengths,
  available_from,
  buffer_minutes,
  cancellation_policy_hours,
  cancellation_charge_percent,
  cancellation_policy_text,
  deposit_enabled,
  deposit_amount,
  deposit_deadline_days,
  booking_mode,
  pupil_app_enabled,
  pupil_app_dark_mode,
  website_theme,
  website_font,
  website_header_style,
  website_button_color,
  website_footer_bg,
  website_text_color,
  website_heading_color,
  website_menu_text_color,
  hero_image_url,
  hero_overlay_color,
  hero_overlay_opacity,
  hero_show_logo,
  website_header_bg,
  lat,
  lng,
  location_name,
  custom_domain,
  custom_domain_verified,
  created_at
FROM public.instructors
WHERE is_active = true;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_instructors TO anon;
GRANT SELECT ON public.public_instructors TO authenticated;
