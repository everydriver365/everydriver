
-- Create expo_push_tokens table for native app push notifications
CREATE TABLE IF NOT EXISTS public.expo_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  token text NOT NULL,
  device_name text,
  platform text DEFAULT 'unknown',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id, token)
);

ALTER TABLE public.expo_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own expo tokens"
  ON public.expo_push_tokens FOR ALL TO authenticated
  USING (instructor_id = get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = get_instructor_id_for_user(auth.uid()));
