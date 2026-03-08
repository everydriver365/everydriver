
-- Community road alerts table
CREATE TABLE public.community_road_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'hazard',
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 hours')
);

ALTER TABLE public.community_road_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can report alerts"
  ON public.community_road_alerts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read non-expired alerts"
  ON public.community_road_alerts FOR SELECT TO authenticated
  USING (expires_at > now());

-- Theory streaks table
CREATE TABLE public.theory_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_practice_date DATE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.theory_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pupils can read own streaks"
  ON public.theory_streaks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Pupils can insert own streaks"
  ON public.theory_streaks FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pupils can update own streaks"
  ON public.theory_streaks FOR UPDATE TO authenticated
  USING (true);
