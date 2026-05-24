
-- ============================================================
-- 2a + 2b: Auto-create lesson_feedback row + LESSON_COMPLETED push
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_request_lesson_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instructor_name TEXT;
BEGIN
  -- Insert feedback request row (idempotent on lesson_history_id+pupil_id)
  INSERT INTO public.lesson_feedback (
    lesson_history_id, pupil_id, instructor_id, requested_at
  ) VALUES (
    NEW.id, NEW.pupil_id, NEW.instructor_id, now()
  )
  ON CONFLICT DO NOTHING;

  SELECT name INTO v_instructor_name FROM public.instructors WHERE id = NEW.instructor_id;

  -- Fire LESSON_COMPLETED push (non-blocking via pg_net)
  PERFORM net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/notify-pupil',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o'
    ),
    body := jsonb_build_object(
      'pupilId', NEW.pupil_id::text,
      'type', 'lesson_completed',
      'data', jsonb_build_object(
        'type', 'lesson_completed',
        'lessonHistoryId', NEW.id::text,
        'instructorName', COALESCE(v_instructor_name, 'your instructor')
      )
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the lesson_history insert if notification fan-out fails
  RAISE WARNING 'auto_request_lesson_feedback failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lesson_history_request_feedback ON public.lesson_history;
CREATE TRIGGER on_lesson_history_request_feedback
  AFTER INSERT ON public.lesson_history
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_request_lesson_feedback();

-- ============================================================
-- 2d: TEST_PASSED push on real pass
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_pupil_test_passed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review_url TEXT;
BEGIN
  IF NEW.result <> 'pass' OR NEW.is_mock = true THEN
    RETURN NEW;
  END IF;

  SELECT google_review_url INTO v_review_url
  FROM public.instructors WHERE id = NEW.instructor_id;

  PERFORM net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/notify-pupil',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o'
    ),
    body := jsonb_build_object(
      'pupilId', NEW.pupil_id::text,
      'type', 'test_passed',
      'data', jsonb_build_object(
        'type', 'test_passed',
        'testResultId', NEW.id::text,
        'googleReviewUrl', v_review_url
      )
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_pupil_test_passed failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_driving_test_pass_notify ON public.driving_test_results;
CREATE TRIGGER on_driving_test_pass_notify
  AFTER INSERT ON public.driving_test_results
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pupil_test_passed();

-- ============================================================
-- 2e: Tighten lesson_feedback RLS
-- ============================================================
-- Drop the wide-open / self-equals-self pupil policies (only pre-existing ones)
DROP POLICY IF EXISTS "Pupils can view own feedback" ON public.lesson_feedback;
DROP POLICY IF EXISTS "Pupils can update own feedback" ON public.lesson_feedback;

-- Pupils may read their own feedback only
CREATE POLICY "Pupils can read own feedback"
  ON public.lesson_feedback FOR SELECT
  TO authenticated
  USING (
    pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
  );

-- Pupils may update (respond to) their own feedback only
CREATE POLICY "Pupils can update own feedback response"
  ON public.lesson_feedback FOR UPDATE
  TO authenticated
  USING (
    pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
  );

-- Note: existing "Instructors can insert/update/view own feedback" policies (which use
-- get_instructor_id_for_user(auth.uid())) are intentionally left intact.
-- The auto_request_lesson_feedback trigger runs as SECURITY DEFINER and bypasses RLS.
