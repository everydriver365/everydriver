
ALTER TABLE public.school_courses
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS full_description text,
  ADD COLUMN IF NOT EXISTS what_to_bring text[],
  ADD COLUMN IF NOT EXISTS prerequisites text[],
  ADD COLUMN IF NOT EXISTS theory_test_details text,
  ADD COLUMN IF NOT EXISTS driving_test_details text,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS terms_conditions text,
  ADD COLUMN IF NOT EXISTS explainer_video_url text;
