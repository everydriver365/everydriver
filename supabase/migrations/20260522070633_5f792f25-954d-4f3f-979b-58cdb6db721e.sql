CREATE TABLE IF NOT EXISTS public.route_distance_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_postcode TEXT NOT NULL,
  to_postcode TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  distance_miles NUMERIC(8,2),
  source TEXT NOT NULL CHECK (source IN ('tomtom','osrm','cache','fallback')),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS route_distance_cache_pair_uidx
  ON public.route_distance_cache (from_postcode, to_postcode);

CREATE INDEX IF NOT EXISTS route_distance_cache_fetched_at_idx
  ON public.route_distance_cache (fetched_at DESC);

ALTER TABLE public.route_distance_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read route cache"
  ON public.route_distance_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Writes are restricted to the service role (edge functions). No INSERT/UPDATE/DELETE
-- policy is created for authenticated users, so client SDK writes are blocked by RLS.