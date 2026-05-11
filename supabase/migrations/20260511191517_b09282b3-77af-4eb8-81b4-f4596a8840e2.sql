CREATE TABLE IF NOT EXISTS public.instructor_feature_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL UNIQUE,
  ai_day_briefing_enabled boolean NOT NULL DEFAULT false,
  auto_rebook_nudges_enabled boolean NOT NULL DEFAULT false,
  test_day_mode_enabled boolean NOT NULL DEFAULT false,
  waitlist_auto_offer_enabled boolean NOT NULL DEFAULT false,
  fuel_cost_tracker_enabled boolean NOT NULL DEFAULT false,
  tax_pot_suggest_enabled boolean NOT NULL DEFAULT false,
  harsh_event_heatmap_enabled boolean NOT NULL DEFAULT false,
  weekly_pnl_widget_enabled boolean NOT NULL DEFAULT false,
  badges_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_feature_toggles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own toggles"
  ON public.instructor_feature_toggles FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert own toggles"
  ON public.instructor_feature_toggles FOR INSERT
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update own toggles"
  ON public.instructor_feature_toggles FOR UPDATE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER trg_feature_toggles_updated_at
  BEFORE UPDATE ON public.instructor_feature_toggles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();