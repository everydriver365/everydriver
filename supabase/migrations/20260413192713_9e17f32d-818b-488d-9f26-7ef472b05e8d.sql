CREATE TABLE public.school_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.school_notifications ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE public.school_notifications;

CREATE INDEX idx_school_notifications_school_id ON public.school_notifications(school_id);
CREATE INDEX idx_school_notifications_unread ON public.school_notifications(school_id) WHERE read_at IS NULL;

CREATE POLICY "School owners view own notifications"
  ON public.school_notifications FOR SELECT TO authenticated
  USING (public.is_school_owner(school_id));

CREATE POLICY "School owners update own notifications"
  ON public.school_notifications FOR UPDATE TO authenticated
  USING (public.is_school_owner(school_id));

CREATE POLICY "Admins manage all notifications"
  ON public.school_notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));