-- ============================================================
-- Lock down sensitive columns on instructors (anon role)
-- ============================================================
-- Revoke wildcard SELECT from anon, then re-grant only safe columns.
REVOKE SELECT ON public.instructors FROM anon;

GRANT SELECT (
  id,
  created_at,
  updated_at,
  name,
  home_postcode,
  radius_miles,
  car_type,
  car_make,
  car_model,
  profile_image_url,
  car_image_url,
  bio,
  hourly_rate,
  is_active,
  buffer_minutes,
  preferred_lesson_length,
  special_skills,
  extra_info,
  brand_colour,
  booking_advance_days,
  personal_website_url,
  facebook_url,
  instagram_url,
  twitter_url,
  linkedin_url,
  custom_branding_enabled,
  available_from,
  allowed_lesson_lengths,
  cpd_certified,
  adi_code_of_practice,
  instructor_grade,
  welcome_video_url,
  cancellation_policy_hours,
  cancellation_charge_percent,
  cancellation_policy_text,
  payment_qr_url,
  logo_url,
  pupil_app_dark_mode,
  pupil_app_enabled,
  secondary_colour,
  app_slug,
  payment_link_base_url,
  preferred_language,
  dark_mode_enabled,
  website_theme,
  website_font,
  website_header_style,
  website_button_color,
  website_footer_bg,
  hero_image_url,
  adi_certificate_url,
  vehicle_mpg,
  fuel_cost_per_litre,
  calendar_colors,
  custom_domain,
  custom_domain_verified,
  mini_website_domain_id,
  deposit_enabled,
  deposit_amount,
  deposit_deadline_days,
  adi_badge_number
) ON public.instructors TO anon;

-- ============================================================
-- Lock down payment-gateway secrets on schools (anon + authenticated)
-- ============================================================
REVOKE SELECT ON public.schools FROM anon;
REVOKE SELECT ON public.schools FROM authenticated;

-- Re-grant SELECT on all non-secret columns to anon and authenticated.
-- Service role retains full access for server-side reads.
GRANT SELECT (
  id,
  name,
  owner_user_id,
  logo_url,
  brand_colour,
  created_at,
  updated_at,
  slug,
  custom_domain,
  description,
  contact_email,
  contact_phone,
  notification_preferences,
  klarna_enabled,
  clearpay_enabled,
  payment_gateway_mode,
  enabled_features,
  franchise_fee_amount,
  website_tier,
  website_theme,
  website_font,
  website_header_style,
  website_header_bg,
  website_footer_bg,
  website_button_color,
  hero_image_url
) ON public.schools TO anon, authenticated;
