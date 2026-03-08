
-- PHASE 1: Critical PII Fixes

-- 1. SCHEDULED_LESSONS: Remove anon SELECT exposing all lesson data
DROP POLICY IF EXISTS "Public can view lesson times for booking" ON public.scheduled_lessons;

-- 2. NOTES: Remove all anon policies
DROP POLICY IF EXISTS "Anon can read pupil notes" ON public.notes;
DROP POLICY IF EXISTS "Anon can insert pupil notes" ON public.notes;
DROP POLICY IF EXISTS "Anon can update pupil notes" ON public.notes;
DROP POLICY IF EXISTS "Anon can delete pupil notes" ON public.notes;
DROP POLICY IF EXISTS "Anon can read shared instructor notes" ON public.notes;

CREATE POLICY "Instructors can read pupil notes for their pupils"
  ON public.notes FOR SELECT TO authenticated
  USING (
    owner_type = 'pupil' AND owner_id::uuid IN (
      SELECT id FROM public.pupils WHERE instructor_id = get_instructor_id_for_user(auth.uid())
    )
  );

-- 3. LESSON_ROUTES: Remove anon SELECT
DROP POLICY IF EXISTS "Anon can read routes by pupil_id" ON public.lesson_routes;

-- 4. LEARNER_TEST_REQUESTS: Fix public SELECT policies
DROP POLICY IF EXISTS "Service role can read all" ON public.learner_test_requests;
DROP POLICY IF EXISTS "Users can view their own test requests" ON public.learner_test_requests;
DROP POLICY IF EXISTS "Authenticated users can submit test requests" ON public.learner_test_requests;

CREATE POLICY "Instructors can view test requests for their pupils"
  ON public.learner_test_requests FOR SELECT TO authenticated
  USING (
    instructor_id = get_instructor_id_for_user(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated users can submit test requests"
  ON public.learner_test_requests FOR INSERT TO authenticated
  WITH CHECK (
    instructor_id = get_instructor_id_for_user(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Anon can submit test requests"
  ON public.learner_test_requests FOR INSERT TO anon
  WITH CHECK (true);

-- 5. THEORY_MOCK_RESULTS
DROP POLICY IF EXISTS "Anon can read own mock results" ON public.theory_mock_results;
DROP POLICY IF EXISTS "Anyone can insert mock results" ON public.theory_mock_results;

CREATE POLICY "Anon can insert mock results with pupil_id"
  ON public.theory_mock_results FOR INSERT TO anon
  WITH CHECK (pupil_id IS NOT NULL);

-- 6. PUPIL_TERMS_AGREEMENTS
DROP POLICY IF EXISTS "Public can view by token" ON public.pupil_terms_agreements;
DROP POLICY IF EXISTS "Update agreement by token" ON public.pupil_terms_agreements;

CREATE POLICY "Public can view pending agreements"
  ON public.pupil_terms_agreements FOR SELECT TO public
  USING (status = 'pending' AND token IS NOT NULL);

CREATE POLICY "Public can sign pending agreements by token"
  ON public.pupil_terms_agreements FOR UPDATE TO public
  USING (status = 'pending' AND token IS NOT NULL)
  WITH CHECK (status IN ('signed', 'declined'));

-- PHASE 2: Sensitive Data Fixes

-- 7. LIVE_CHAT_SESSIONS
DROP POLICY IF EXISTS "Anyone can view chat sessions" ON public.live_chat_sessions;

CREATE POLICY "Authenticated users can view chat sessions"
  ON public.live_chat_sessions FOR SELECT TO authenticated
  USING (
    instructor_id = get_instructor_id_for_user(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Anon can view chat sessions"
  ON public.live_chat_sessions FOR SELECT TO anon
  USING (true);

-- 8. LIVE_CHAT_MESSAGES
DROP POLICY IF EXISTS "Anyone can view messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.live_chat_messages;

CREATE POLICY "Authenticated users can view chat messages"
  ON public.live_chat_messages FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.live_chat_sessions
      WHERE instructor_id = get_instructor_id_for_user(auth.uid())
         OR has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Anon can read messages by session"
  ON public.live_chat_messages FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anyone can send chat messages"
  ON public.live_chat_messages FOR INSERT TO public
  WITH CHECK (true);

-- 9. SOS_ALERTS: Remove cross-instructor visibility
DROP POLICY IF EXISTS "Instructors can read own and SOS alerts" ON public.sos_alerts;

CREATE POLICY "Instructors can read own SOS alerts"
  ON public.sos_alerts FOR SELECT TO authenticated
  USING (
    instructor_id = get_instructor_id_for_user(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- 10. CALENDAR_SHARES: Remove public token enumeration
DROP POLICY IF EXISTS "Public can view enabled shares by token" ON public.instructor_calendar_shares;

-- PHASE 3: Hardening

-- 11. GEOTAB_SESSION_CACHE
DROP POLICY IF EXISTS "Authenticated users can manage session cache" ON public.geotab_session_cache;

-- 12. INSTRUCTOR_BOOKING_SETTINGS
DROP POLICY IF EXISTS "Instructors can manage own booking settings" ON public.instructor_booking_settings;
DROP POLICY IF EXISTS "Pupils can view instructor booking settings" ON public.instructor_booking_settings;

CREATE POLICY "Instructors can manage own booking settings"
  ON public.instructor_booking_settings FOR ALL TO authenticated
  USING (instructor_id = get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Public can view booking settings"
  ON public.instructor_booking_settings FOR SELECT TO public
  USING (true);

-- 13. Create pupil_credentials table
CREATE TABLE IF NOT EXISTS public.pupil_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id uuid NOT NULL UNIQUE REFERENCES public.pupils(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.pupil_credentials ENABLE ROW LEVEL SECURITY;

-- Migrate existing password hashes
INSERT INTO public.pupil_credentials (pupil_id, password_hash)
SELECT id, password_hash FROM public.pupils WHERE password_hash IS NOT NULL
ON CONFLICT (pupil_id) DO NOTHING;

-- Remove password_hash from pupils table
ALTER TABLE public.pupils DROP COLUMN IF EXISTS password_hash;
