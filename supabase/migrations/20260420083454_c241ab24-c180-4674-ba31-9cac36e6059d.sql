
-- 1. Extend instructors table
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS accessibility_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adaptations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS disability_experience text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bsl_signing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS motability_friendly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accessibility_bio text;

-- 2. accessible_garages
CREATE TABLE IF NOT EXISTS public.accessible_garages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  postcode text,
  latitude double precision,
  longitude double precision,
  phone text,
  email text,
  website text,
  services text[] NOT NULL DEFAULT '{}',
  motability_approved boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accessible_garages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Garages are viewable by everyone"
  ON public.accessible_garages FOR SELECT USING (true);

CREATE POLICY "Admins can insert garages"
  ON public.accessible_garages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update garages"
  ON public.accessible_garages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete garages"
  ON public.accessible_garages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_accessible_garages_updated_at
  BEFORE UPDATE ON public.accessible_garages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. accessible_forum_topics
CREATE TABLE IF NOT EXISTS public.accessible_forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  author_user_id uuid,
  author_name text NOT NULL,
  reply_count integer NOT NULL DEFAULT 0,
  last_reply_at timestamptz,
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accessible_forum_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are viewable by everyone"
  ON public.accessible_forum_topics FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics"
  ON public.accessible_forum_topics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "Authors or admins can update topics"
  ON public.accessible_forum_topics FOR UPDATE TO authenticated
  USING (auth.uid() = author_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors or admins can delete topics"
  ON public.accessible_forum_topics FOR DELETE TO authenticated
  USING (auth.uid() = author_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_accessible_forum_topics_updated_at
  BEFORE UPDATE ON public.accessible_forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. accessible_forum_replies
CREATE TABLE IF NOT EXISTS public.accessible_forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.accessible_forum_topics(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_user_id uuid,
  author_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accessible_forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies are viewable by everyone"
  ON public.accessible_forum_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON public.accessible_forum_replies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "Authors or admins can delete replies"
  ON public.accessible_forum_replies FOR DELETE TO authenticated
  USING (auth.uid() = author_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_accessible_forum_replies_topic ON public.accessible_forum_replies(topic_id);

-- Trigger to keep reply_count + last_reply_at in sync
CREATE OR REPLACE FUNCTION public.update_accessible_forum_topic_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.accessible_forum_topics
      SET reply_count = reply_count + 1,
          last_reply_at = NEW.created_at,
          updated_at = now()
    WHERE id = NEW.topic_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.accessible_forum_topics
      SET reply_count = GREATEST(0, reply_count - 1),
          updated_at = now()
    WHERE id = OLD.topic_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_accessible_forum_topic_on_reply
  AFTER INSERT OR DELETE ON public.accessible_forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_accessible_forum_topic_on_reply();

-- 5. accessible_trackers
CREATE TABLE IF NOT EXISTS public.accessible_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  description text,
  features text[] NOT NULL DEFAULT '{}',
  supports_adaptations boolean NOT NULL DEFAULT false,
  price_monthly numeric,
  price_one_off numeric,
  fitting_required boolean NOT NULL DEFAULT false,
  image_url text,
  affiliate_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accessible_trackers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trackers are viewable by everyone"
  ON public.accessible_trackers FOR SELECT USING (true);

CREATE POLICY "Admins can insert trackers"
  ON public.accessible_trackers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trackers"
  ON public.accessible_trackers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trackers"
  ON public.accessible_trackers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_accessible_trackers_updated_at
  BEFORE UPDATE ON public.accessible_trackers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
