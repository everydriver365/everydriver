
-- =============================================
-- BATCH 1: DROP ALL temp_rork_* DEBUG POLICIES
-- =============================================

DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.clock_entries;
DROP POLICY IF EXISTS "temp_rork_anon_read_conversations" ON public.conversations;
DROP POLICY IF EXISTS "temp_rork_anon_read_geotab_driver_events" ON public.geotab_driver_events;
DROP POLICY IF EXISTS "temp_rork_anon_read_geotab_fault_codes" ON public.geotab_fault_codes;
DROP POLICY IF EXISTS "temp_rork_anon_read_geotab_fuel_usage" ON public.geotab_fuel_usage;
DROP POLICY IF EXISTS "temp_rork_anon_read_geotab_impact_events" ON public.geotab_impact_events;
DROP POLICY IF EXISTS "temp_rork_anon_update_geotab_impact_events" ON public.geotab_impact_events;
DROP POLICY IF EXISTS "temp_rork_anon_read_gps_devices" ON public.gps_devices;
DROP POLICY IF EXISTS "temp_rork_anon_update_gps_devices" ON public.gps_devices;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.instructor_expenses;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.instructor_todos;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.lesson_telematics;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.live_pupil_positions;
DROP POLICY IF EXISTS "temp_rork_anon_read_messages" ON public.messages;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.mileage_logs;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.payment_history;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.pupils;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.scheduled_lessons;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.telematics_alerts;
DROP POLICY IF EXISTS "temp_rork_anon_read" ON public.telematics_gps_points;

-- =============================================
-- FIX: Pupil data anonymous exposure
-- =============================================

DROP POLICY IF EXISTS "Anon can select pupil by id" ON public.pupils;

-- =============================================
-- FIX: Parent portal data exposure
-- =============================================

DROP POLICY IF EXISTS "Anyone can manage parent conversations" ON public.parent_conversations;
DROP POLICY IF EXISTS "Anyone can manage parent messages" ON public.parent_messages;
DROP POLICY IF EXISTS "Anyone can manage parent push subs" ON public.parent_push_subscriptions;

CREATE POLICY "Service role manages parent conversations"
  ON public.parent_conversations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages parent messages"
  ON public.parent_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages parent push subs"
  ON public.parent_push_subscriptions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Instructors can read own parent conversations"
  ON public.parent_conversations FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can read own parent messages"
  ON public.parent_messages FOR SELECT
  TO authenticated
  USING (conversation_id IN (
    SELECT id FROM public.parent_conversations 
    WHERE instructor_id = public.get_instructor_id_for_user(auth.uid())
  ));

-- =============================================
-- FIX: Live chat anonymous exposure
-- =============================================

DROP POLICY IF EXISTS "Anon can view chat sessions" ON public.live_chat_sessions;
DROP POLICY IF EXISTS "Anon can read messages by session" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can manage typing indicators" ON public.live_chat_typing;

CREATE POLICY "Service role manages chat sessions"
  ON public.live_chat_sessions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon can read chat sessions"
  ON public.live_chat_sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Service role manages chat messages"
  ON public.live_chat_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon can read chat messages"
  ON public.live_chat_messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can manage typing indicators"
  ON public.live_chat_typing FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =============================================
-- FIX: Pupil goals exposure
-- =============================================

DROP POLICY IF EXISTS "Anyone can read pupil goals" ON public.pupil_goals;
DROP POLICY IF EXISTS "Anyone can insert pupil goals" ON public.pupil_goals;
DROP POLICY IF EXISTS "Anyone can update pupil goals" ON public.pupil_goals;
DROP POLICY IF EXISTS "Anyone can delete pupil goals" ON public.pupil_goals;

CREATE POLICY "Instructors can manage own pupil goals"
  ON public.pupil_goals FOR ALL
  TO authenticated
  USING (pupil_id IN (
    SELECT id FROM public.pupils 
    WHERE instructor_id = public.get_instructor_id_for_user(auth.uid())
  ))
  WITH CHECK (pupil_id IN (
    SELECT id FROM public.pupils 
    WHERE instructor_id = public.get_instructor_id_for_user(auth.uid())
  ));

CREATE POLICY "Service role manages pupil goals"
  ON public.pupil_goals FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- =============================================
-- FIX: Lesson streaks exposure
-- =============================================

DROP POLICY IF EXISTS "Anyone can read lesson streaks" ON public.lesson_streaks;
DROP POLICY IF EXISTS "Anyone can insert lesson streaks" ON public.lesson_streaks;
DROP POLICY IF EXISTS "Anyone can update lesson streaks" ON public.lesson_streaks;

CREATE POLICY "Service role manages lesson streaks"
  ON public.lesson_streaks FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Instructors can read own pupil streaks"
  ON public.lesson_streaks FOR SELECT
  TO authenticated
  USING (pupil_id IN (
    SELECT id FROM public.pupils 
    WHERE instructor_id = public.get_instructor_id_for_user(auth.uid())
  ));
