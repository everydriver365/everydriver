-- Re-create the safe public view of active instructors with security_definer
-- so anonymous and authenticated visitors can read it without needing direct
-- access to the locked-down `instructors` table. Also expose business_name,
-- phone, and email so public contact pages can populate from the record.
DROP VIEW IF EXISTS public.public_instructors;

CREATE VIEW public.public_instructors
WITH (security_invoker = false) AS
SELECT
  id, name, business_name, phone, email,
  bio, profile_image_url, car_image_url, car_type, car_make, car_model,
  home_postcode, radius_miles, hourly_rate, is_active, special_skills, extra_info,
  brand_colour, secondary_colour, app_slug, custom_branding_enabled, cpd_certified,
  instructor_grade, welcome_video_url, logo_url, personal_website_url,
  facebook_url, instagram_url, twitter_url, linkedin_url,
  booking_advance_days, preferred_lesson_length, allowed_lesson_lengths,
  available_from, buffer_minutes, cancellation_policy_hours,
  cancellation_charge_percent, cancellation_policy_text,
  deposit_enabled, deposit_amount, deposit_deadline_days,
  booking_mode, pupil_app_enabled, pupil_app_dark_mode,
  website_theme, website_font, website_header_style, website_button_color,
  website_footer_bg, website_text_color, website_heading_color, website_menu_text_color,
  hero_image_url, hero_overlay_color, hero_overlay_opacity, hero_show_logo,
  website_header_bg, lat, lng, location_name, custom_domain, custom_domain_verified,
  created_at,
  weekend_surcharge_amount,
  bank_holiday_surcharge_amount,
  odd_hours_surcharge_amount,
  odd_hours_start,
  odd_hours_end
FROM public.instructors
WHERE is_active = true;

GRANT SELECT ON public.public_instructors TO anon, authenticated;