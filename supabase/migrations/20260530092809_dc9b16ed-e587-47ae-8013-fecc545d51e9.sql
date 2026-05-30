
-- =========================================================
-- DSM Pro Rewards — Phase 1 foundation
-- =========================================================

-- 1. instructor_points
CREATE TABLE public.instructor_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  season_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::integer,
  tier text NOT NULL DEFAULT 'bronze'
    CHECK (tier IN ('bronze','silver','gold','platinum','elite','suspended')),
  tier_updated_at timestamptz,
  tier_drop_grace_period_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, season_year)
);

GRANT SELECT ON public.instructor_points TO authenticated;
GRANT ALL ON public.instructor_points TO service_role;
ALTER TABLE public.instructor_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own points"
  ON public.instructor_points FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins view all points"
  ON public.instructor_points FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Leaderboard read access (anonymised in app layer; raw rows readable to authed users)
CREATE POLICY "Authenticated can read leaderboard points"
  ON public.instructor_points FOR SELECT TO authenticated
  USING (true);

-- 2. instructor_point_transactions
CREATE TABLE public.instructor_point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text NOT NULL,
  category text NOT NULL
    CHECK (category IN ('course','lesson','compliance','review','complaint','loyalty','referral','manual')),
  reference_id uuid,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed','pending','reversed')),
  season_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.instructor_point_transactions TO authenticated;
GRANT ALL ON public.instructor_point_transactions TO service_role;
ALTER TABLE public.instructor_point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own transactions"
  ON public.instructor_point_transactions FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins view all transactions"
  ON public.instructor_point_transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. instructor_badges
CREATE TABLE public.instructor_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  badge_key text NOT NULL
    CHECK (badge_key IN ('five_star','pass_machine','on_a_roll','compliant','syllabus_pro','course_master','loyal_pro','champion')),
  badge_label text NOT NULL,
  badge_emoji text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  season_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::integer,
  is_permanent boolean NOT NULL DEFAULT false,
  UNIQUE (instructor_id, badge_key, season_year)
);

GRANT SELECT ON public.instructor_badges TO authenticated;
GRANT SELECT ON public.instructor_badges TO anon; -- public mini-website needs to read pupil-relevant badges
GRANT ALL ON public.instructor_badges TO service_role;
ALTER TABLE public.instructor_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges (public profile)"
  ON public.instructor_badges FOR SELECT
  USING (true);

-- 4. leaderboard_seasons
CREATE TABLE public.leaderboard_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year integer UNIQUE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  prize_1st integer NOT NULL DEFAULT 1000,
  prize_2nd integer NOT NULL DEFAULT 500,
  prize_3rd integer NOT NULL DEFAULT 250,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','closed','paid')),
  winner_instructor_id uuid REFERENCES public.instructors(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.leaderboard_seasons TO authenticated;
GRANT SELECT ON public.leaderboard_seasons TO anon;
GRANT ALL ON public.leaderboard_seasons TO service_role;
ALTER TABLE public.leaderboard_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons"
  ON public.leaderboard_seasons FOR SELECT
  USING (true);

CREATE POLICY "Admins manage seasons"
  ON public.leaderboard_seasons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.leaderboard_seasons (season_year, start_date, end_date)
VALUES (2026, '2026-01-01', '2026-12-31')
ON CONFLICT (season_year) DO NOTHING;

-- 5. instructor_rewards
CREATE TABLE public.instructor_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  reward_key text NOT NULL
    CHECK (reward_key IN ('cpd_course','website_basic','website_full','seo','radio','tv','fee_reduction','press_release','awards_dinner')),
  reward_label text NOT NULL,
  tier_required text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','fulfilled','expired')),
  notes text,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz,
  fulfilled_by text
);

GRANT SELECT, INSERT ON public.instructor_rewards TO authenticated;
GRANT ALL ON public.instructor_rewards TO service_role;
ALTER TABLE public.instructor_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own rewards"
  ON public.instructor_rewards FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors claim own rewards"
  ON public.instructor_rewards FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins manage all rewards"
  ON public.instructor_rewards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. instructor_complaints
CREATE TABLE public.instructor_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  complaint_text text,
  raised_by text,
  status text NOT NULL DEFAULT 'investigating'
    CHECK (status IN ('investigating','upheld','dismissed')),
  points_held integer NOT NULL DEFAULT 100,
  points_deducted integer NOT NULL DEFAULT 0,
  investigated_by text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.instructor_complaints TO authenticated;
GRANT ALL ON public.instructor_complaints TO service_role;
ALTER TABLE public.instructor_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own complaints"
  ON public.instructor_complaints FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins manage all complaints"
  ON public.instructor_complaints FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_inst_pts_instructor ON public.instructor_points(instructor_id);
CREATE INDEX idx_inst_pts_season ON public.instructor_points(season_year);
CREATE INDEX idx_inst_pts_season_total ON public.instructor_points(season_year, total_points DESC);
CREATE INDEX idx_inst_txn_instructor ON public.instructor_point_transactions(instructor_id);
CREATE INDEX idx_inst_txn_season ON public.instructor_point_transactions(season_year);
CREATE INDEX idx_inst_txn_created ON public.instructor_point_transactions(created_at DESC);
CREATE INDEX idx_inst_badges_instructor ON public.instructor_badges(instructor_id);
CREATE INDEX idx_inst_rewards_instructor ON public.instructor_rewards(instructor_id);
CREATE INDEX idx_inst_complaints_instructor ON public.instructor_complaints(instructor_id);
CREATE INDEX idx_inst_complaints_status ON public.instructor_complaints(status);

-- updated_at trigger on instructor_points
CREATE TRIGGER trg_instructor_points_updated_at
  BEFORE UPDATE ON public.instructor_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Additive columns on instructors for rewards settings
-- =========================================================
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS show_on_leaderboard boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_tier_change boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_badge_earned boolean NOT NULL DEFAULT true;
