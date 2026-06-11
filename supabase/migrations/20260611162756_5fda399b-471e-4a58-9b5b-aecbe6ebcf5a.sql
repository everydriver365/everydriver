ALTER TABLE public.instructor_booking_settings
  ADD COLUMN IF NOT EXISTS allow_start_date_only_booking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS start_date_only_max_hours_per_week integer;

DO $$ BEGIN
  CREATE TYPE public.course_reservation_status AS ENUM (
    'awaiting_scheduling',
    'partially_scheduled',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.course_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.instructor_courses(id) ON DELETE RESTRICT,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id uuid NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  completion_window_weeks integer NOT NULL CHECK (completion_window_weeks > 0 AND completion_window_weeks <= 52),
  allowed_days integer[] NOT NULL CHECK (array_length(allowed_days, 1) > 0),
  time_windows text[] NOT NULL CHECK (array_length(time_windows, 1) > 0),
  hours_per_week_cap integer NOT NULL CHECK (hours_per_week_cap > 0 AND hours_per_week_cap <= 60),
  total_hours integer NOT NULL CHECK (total_hours > 0),
  hours_scheduled integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_intent_id text,
  amount_paid_pence integer NOT NULL DEFAULT 0,
  status public.course_reservation_status NOT NULL DEFAULT 'awaiting_scheduling',
  pupil_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_reservations_instructor_status_idx
  ON public.course_reservations (instructor_id, status);
CREATE INDEX IF NOT EXISTS course_reservations_pupil_idx
  ON public.course_reservations (pupil_id);

GRANT SELECT, UPDATE ON public.course_reservations TO authenticated;
GRANT ALL ON public.course_reservations TO service_role;

ALTER TABLE public.course_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pupils can view their own reservations"
  ON public.course_reservations FOR SELECT
  TO authenticated
  USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));

CREATE POLICY "Pupils can update their own reservations"
  ON public.course_reservations FOR UPDATE
  TO authenticated
  USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()))
  WITH CHECK (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can view their reservations"
  ON public.course_reservations FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update their reservations"
  ON public.course_reservations FOR UPDATE
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER course_reservations_updated_at
  BEFORE UPDATE ON public.course_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES public.course_reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS scheduled_lessons_reservation_id_idx
  ON public.scheduled_lessons (reservation_id) WHERE reservation_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.refresh_reservation_progress(_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_scheduled numeric;
BEGIN
  IF _reservation_id IS NULL THEN RETURN; END IF;

  SELECT total_hours INTO v_total
  FROM public.course_reservations
  WHERE id = _reservation_id;

  IF v_total IS NULL THEN RETURN; END IF;

  SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 INTO v_scheduled
  FROM public.scheduled_lessons
  WHERE reservation_id = _reservation_id
    AND COALESCE(status, 'scheduled') <> 'cancelled';

  UPDATE public.course_reservations
  SET hours_scheduled = FLOOR(v_scheduled),
      status = CASE
        WHEN status = 'cancelled' THEN 'cancelled'
        WHEN v_scheduled >= v_total THEN 'completed'
        WHEN v_scheduled > 0 THEN 'partially_scheduled'
        ELSE 'awaiting_scheduling'
      END,
      updated_at = now()
  WHERE id = _reservation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.scheduled_lessons_reservation_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_reservation_progress(OLD.reservation_id);
    RETURN OLD;
  ELSE
    IF TG_OP = 'UPDATE' AND OLD.reservation_id IS DISTINCT FROM NEW.reservation_id THEN
      PERFORM public.refresh_reservation_progress(OLD.reservation_id);
    END IF;
    PERFORM public.refresh_reservation_progress(NEW.reservation_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS scheduled_lessons_reservation_sync_trg ON public.scheduled_lessons;
CREATE TRIGGER scheduled_lessons_reservation_sync_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.scheduled_lessons
  FOR EACH ROW EXECUTE FUNCTION public.scheduled_lessons_reservation_sync();