
-- =============================================
-- FIX: driving_behavior_events broken policies
-- =============================================
DROP POLICY IF EXISTS "Instructors can view their session events" ON public.driving_behavior_events;
DROP POLICY IF EXISTS "Instructors can delete their session events" ON public.driving_behavior_events;
DROP POLICY IF EXISTS "Instructors can insert their session events" ON public.driving_behavior_events;

CREATE POLICY "Instructors can view their session events" ON public.driving_behavior_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM lesson_telematics lt WHERE lt.id = driving_behavior_events.telematics_id AND lt.instructor_id = public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Instructors can delete their session events" ON public.driving_behavior_events
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM lesson_telematics lt WHERE lt.id = driving_behavior_events.telematics_id AND lt.instructor_id = public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Instructors can insert their session events" ON public.driving_behavior_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM lesson_telematics lt WHERE lt.id = driving_behavior_events.telematics_id AND lt.instructor_id = public.get_instructor_id_for_user(auth.uid())));

-- =============================================
-- FIX: instructor_reminder_preferences broken policies
-- =============================================
DROP POLICY IF EXISTS "Instructors can view their own preferences" ON public.instructor_reminder_preferences;
DROP POLICY IF EXISTS "Instructors can update their own preferences" ON public.instructor_reminder_preferences;
DROP POLICY IF EXISTS "Instructors can insert their own preferences" ON public.instructor_reminder_preferences;

CREATE POLICY "Instructors can view their own preferences" ON public.instructor_reminder_preferences
  FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update their own preferences" ON public.instructor_reminder_preferences
  FOR UPDATE TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can insert their own preferences" ON public.instructor_reminder_preferences
  FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- =============================================
-- FIX: lesson_video_clips broken policy
-- =============================================
DROP POLICY IF EXISTS "Instructors can manage own video clips" ON public.lesson_video_clips;

CREATE POLICY "Instructors can manage own video clips" ON public.lesson_video_clips
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- =============================================
-- FIX: mileage_log broken policies
-- =============================================
DROP POLICY IF EXISTS "Instructors can manage their mileage log" ON public.mileage_log;
DROP POLICY IF EXISTS "Instructors can view their mileage log" ON public.mileage_log;

CREATE POLICY "Instructors can manage their mileage log" ON public.mileage_log
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- =============================================
-- FIX: offline_sync_queue broken policy
-- =============================================
DROP POLICY IF EXISTS "Instructors can manage own sync queue" ON public.offline_sync_queue;

CREATE POLICY "Instructors can manage own sync queue" ON public.offline_sync_queue
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- =============================================
-- FIX: reward_redemptions broken policy
-- =============================================
DROP POLICY IF EXISTS "Instructors can manage redemptions for their pupils" ON public.reward_redemptions;

CREATE POLICY "Instructors can manage redemptions for their pupils" ON public.reward_redemptions
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- =============================================
-- FIX: telematics_alerts broken policies
-- =============================================
DROP POLICY IF EXISTS "Instructors can view alerts for their sessions" ON public.telematics_alerts;
DROP POLICY IF EXISTS "Instructors can update alerts for their sessions" ON public.telematics_alerts;

CREATE POLICY "Instructors can view alerts for their sessions" ON public.telematics_alerts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM lesson_telematics lt WHERE lt.id = telematics_alerts.telematics_id AND lt.instructor_id = public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Instructors can update alerts for their sessions" ON public.telematics_alerts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM lesson_telematics lt WHERE lt.id = telematics_alerts.telematics_id AND lt.instructor_id = public.get_instructor_id_for_user(auth.uid())));

-- =============================================
-- FIX: telematics_motion_raw broken policy
-- =============================================
DROP POLICY IF EXISTS "Instructors can view motion data for their sessions" ON public.telematics_motion_raw;

CREATE POLICY "Instructors can view motion data for their sessions" ON public.telematics_motion_raw
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM lesson_telematics lt WHERE lt.id = telematics_motion_raw.telematics_id AND lt.instructor_id = public.get_instructor_id_for_user(auth.uid())));

-- =============================================
-- FIX: theory_test_attempts broken policy
-- =============================================
DROP POLICY IF EXISTS "Instructors can manage theory attempts for their pupils" ON public.theory_test_attempts;

CREATE POLICY "Instructors can manage theory attempts for their pupils" ON public.theory_test_attempts
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- =============================================
-- FIX: vehicle_health broken policies
-- =============================================
DROP POLICY IF EXISTS "Instructors can manage their vehicle health" ON public.vehicle_health;
DROP POLICY IF EXISTS "Instructors can view their vehicle health" ON public.vehicle_health;

CREATE POLICY "Instructors can manage their vehicle health" ON public.vehicle_health
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- =============================================
-- FIX: expense-receipts storage bucket security
-- =============================================
DROP POLICY IF EXISTS "Anyone can delete receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;

CREATE POLICY "Authenticated can upload receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expense-receipts');

CREATE POLICY "Authenticated can view receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'expense-receipts');

CREATE POLICY "Authenticated can update receipts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'expense-receipts');

CREATE POLICY "Authenticated can delete receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'expense-receipts');
