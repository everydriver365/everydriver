ALTER TABLE public.google_place_reviews ADD COLUMN IF NOT EXISTS photo_reference text;
UPDATE public.google_place_reviews SET fetched_at = '2000-01-01'::timestamptz WHERE photo_reference IS NULL;