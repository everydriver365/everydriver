
CREATE TABLE public.waiting_room_config (
  id text PRIMARY KEY DEFAULT 'default',
  zoom_link text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  description text DEFAULT 'Informal weekly Zoom get-togethers for driving instructors.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.waiting_room_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  title text NOT NULL DEFAULT 'The Waiting Room',
  notes text,
  is_cancelled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waiting_room_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_room_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read waiting room config" ON public.waiting_room_config FOR SELECT USING (true);
CREATE POLICY "Anyone can read waiting room sessions" ON public.waiting_room_sessions FOR SELECT USING (true);

CREATE POLICY "Admins can manage waiting room config" ON public.waiting_room_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage waiting room sessions" ON public.waiting_room_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.waiting_room_config (id, zoom_link, description) VALUES ('default', '', 'Informal weekly Zoom get-togethers for driving instructors. Chat, share tips & unwind.');
