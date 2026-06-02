-- Single source of truth for instructor ratings
CREATE OR REPLACE VIEW public.instructor_rating_summary
WITH (security_invoker=on) AS
SELECT
  instructor_id,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(*)::int AS total_reviews,
  MAX(COALESCE(review_date::timestamptz, created_at)) AS last_review_at
FROM public.course_reviews
WHERE is_visible = true
  AND moderation_status = 'approved'
GROUP BY instructor_id;

GRANT SELECT ON public.instructor_rating_summary TO anon, authenticated;