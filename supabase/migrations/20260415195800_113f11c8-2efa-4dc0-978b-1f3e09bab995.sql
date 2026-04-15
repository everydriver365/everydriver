
CREATE TABLE public.admin_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  event_type TEXT NOT NULL DEFAULT 'online_webinar',
  link_url TEXT,
  link_label TEXT DEFAULT 'Join Event',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active events"
ON public.admin_events FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can do everything with events"
ON public.admin_events FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_events_updated_at
BEFORE UPDATE ON public.admin_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
