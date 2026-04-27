-- 1. Notification settings table
CREATE TABLE public.instructor_notification_settings (
  instructor_id uuid PRIMARY KEY REFERENCES public.instructors(id) ON DELETE CASCADE,
  delivery_cadence text NOT NULL DEFAULT 'real_time'
    CHECK (delivery_cadence IN ('real_time','hourly','daily','important_only')),
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end   time DEFAULT '07:00',
  category_mutes jsonb NOT NULL DEFAULT '{}'::jsonb,
  notification_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own notification settings"
  ON public.instructor_notification_settings
  FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert own notification settings"
  ON public.instructor_notification_settings
  FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update own notification settings"
  ON public.instructor_notification_settings
  FOR UPDATE TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER update_instructor_notification_settings_updated_at
  BEFORE UPDATE ON public.instructor_notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Snooze column on notifications
ALTER TABLE public.instructor_notifications
  ADD COLUMN snoozed_until timestamptz;

CREATE INDEX idx_instructor_notifications_snoozed
  ON public.instructor_notifications (instructor_id, snoozed_until)
  WHERE snoozed_until IS NOT NULL;