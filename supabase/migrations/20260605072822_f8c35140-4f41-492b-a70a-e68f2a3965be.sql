
CREATE TABLE public.google_place_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  place_id text,
  place_name text,
  rating numeric,
  user_ratings_total integer,
  reviews jsonb NOT NULL DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.google_place_reviews TO anon;
GRANT SELECT ON public.google_place_reviews TO authenticated;
GRANT ALL ON public.google_place_reviews TO service_role;

ALTER TABLE public.google_place_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached google reviews"
  ON public.google_place_reviews FOR SELECT
  USING (true);
