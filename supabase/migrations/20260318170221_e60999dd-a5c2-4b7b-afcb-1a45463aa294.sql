
-- Platform updates (admin-posted)
CREATE TABLE public.platform_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'feature',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read published updates" ON public.platform_updates
  FOR SELECT TO authenticated USING (is_published = true);

-- Feature suggestions (instructor-submitted)
CREATE TABLE public.feature_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read suggestions" ON public.feature_suggestions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instructors can insert own suggestions" ON public.feature_suggestions
  FOR INSERT TO authenticated WITH CHECK (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
  );

-- Feature suggestion votes
CREATE TABLE public.feature_suggestion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES public.feature_suggestions(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  vote smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (suggestion_id, instructor_id)
);
ALTER TABLE public.feature_suggestion_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read votes" ON public.feature_suggestion_votes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instructors can insert own votes" ON public.feature_suggestion_votes
  FOR INSERT TO authenticated WITH CHECK (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
  );
CREATE POLICY "Instructors can update own votes" ON public.feature_suggestion_votes
  FOR UPDATE TO authenticated USING (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
  );
CREATE POLICY "Instructors can delete own votes" ON public.feature_suggestion_votes
  FOR DELETE TO authenticated USING (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
  );

-- Function to update vote counts on feature_suggestions
CREATE OR REPLACE FUNCTION public.update_suggestion_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN target_id := OLD.suggestion_id;
  ELSE target_id := NEW.suggestion_id;
  END IF;

  UPDATE public.feature_suggestions SET
    upvotes = (SELECT count(*) FROM public.feature_suggestion_votes WHERE suggestion_id = target_id AND vote = 1),
    downvotes = (SELECT count(*) FROM public.feature_suggestion_votes WHERE suggestion_id = target_id AND vote = -1)
  WHERE id = target_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

CREATE TRIGGER trg_update_suggestion_votes
AFTER INSERT OR UPDATE OR DELETE ON public.feature_suggestion_votes
FOR EACH ROW EXECUTE FUNCTION public.update_suggestion_vote_counts();
