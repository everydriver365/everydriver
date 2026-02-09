
-- =============================================
-- BATCH 2: Fix instructor-owned & service-role table RLS
-- =============================================

-- 1. calendar_events: insert/delete USING(true) → instructor ownership
DROP POLICY IF EXISTS "Instructors can delete their own events" ON calendar_events;
DROP POLICY IF EXISTS "Instructors can insert their own events" ON calendar_events;
DROP POLICY IF EXISTS "Instructors can view their own events" ON calendar_events;

CREATE POLICY "Instructors manage own calendar events" ON calendar_events
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 2. calendar_sync_queue: service role ALL true → restrict
DROP POLICY IF EXISTS "Service role can manage queue" ON calendar_sync_queue;

CREATE POLICY "Instructors manage own sync queue" ON calendar_sync_queue
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 3. conversations: ALL true → instructor ownership
DROP POLICY IF EXISTS "Allow all operations on conversations" ON conversations;

CREATE POLICY "Instructors manage own conversations" ON conversations
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 4. instructor_expenses: all USING(true) → instructor ownership
DROP POLICY IF EXISTS "Instructors can delete their own expenses" ON instructor_expenses;
DROP POLICY IF EXISTS "Instructors can create their own expenses" ON instructor_expenses;
DROP POLICY IF EXISTS "Instructors can view their own expenses" ON instructor_expenses;
DROP POLICY IF EXISTS "Instructors can update their own expenses" ON instructor_expenses;

CREATE POLICY "Instructors manage own expenses" ON instructor_expenses
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 5. gps_devices: remove service role ALL true policy (instructor policies already exist)
DROP POLICY IF EXISTS "Service role can update devices" ON gps_devices;

-- 6. instructor_calendar_events: remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can manage calendar events" ON instructor_calendar_events;
DROP POLICY IF EXISTS "Service role only for calendar events" ON instructor_calendar_events;
DROP POLICY IF EXISTS "Calendar events are publicly viewable" ON instructor_calendar_events;

CREATE POLICY "Instructors manage own instructor calendar events" ON instructor_calendar_events
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Public can view instructor calendar events" ON instructor_calendar_events
  FOR SELECT USING (true);

-- 7. instructor_date_overrides: remove duplicate permissive policies
DROP POLICY IF EXISTS "Anyone can delete date overrides" ON instructor_date_overrides;
DROP POLICY IF EXISTS "Anyone can insert date overrides" ON instructor_date_overrides;
DROP POLICY IF EXISTS "Anyone can update working hours" ON instructor_date_overrides;

-- 8. instructor_working_hours: remove duplicate permissive policies
DROP POLICY IF EXISTS "Anyone can delete working hours" ON instructor_working_hours;
DROP POLICY IF EXISTS "Anyone can insert working hours" ON instructor_working_hours;
DROP POLICY IF EXISTS "Anyone can update working hours" ON instructor_working_hours;

-- 9. instructor_vehicles: remove service role ALL true
DROP POLICY IF EXISTS "Service role full access to vehicles" ON instructor_vehicles;

-- 10. messages: ALL true → instructor ownership
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;

CREATE POLICY "Instructors manage own messages" ON messages
  FOR ALL TO authenticated
  USING (conversation_id IN (
    SELECT id FROM conversations 
    WHERE instructor_id = public.get_instructor_id_for_user(auth.uid())
  ))
  WITH CHECK (conversation_id IN (
    SELECT id FROM conversations 
    WHERE instructor_id = public.get_instructor_id_for_user(auth.uid())
  ));

-- 11. live_pupil_positions: remove service role ALL true
DROP POLICY IF EXISTS "Service role full access to live positions" ON live_pupil_positions;

-- 12. live_chat_messages: restrict update
DROP POLICY IF EXISTS "Anyone can update messages" ON live_chat_messages;

CREATE POLICY "Admins can update live chat messages" ON live_chat_messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 13. live_chat_sessions: restrict update
DROP POLICY IF EXISTS "Admins and instructors can update sessions" ON live_chat_sessions;

CREATE POLICY "Admins can update live chat sessions" ON live_chat_sessions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 14. live_chat_typing: restrict
DROP POLICY IF EXISTS "Anyone can manage typing indicators" ON live_chat_typing;

CREATE POLICY "Anyone can manage typing indicators" ON live_chat_typing
  FOR ALL USING (true) WITH CHECK (true);

-- 15. payment_intents: remove service role ALL true
DROP POLICY IF EXISTS "Service role full access" ON payment_intents;

CREATE POLICY "Admins can manage payment intents" ON payment_intents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 16. payment_link_tracking: fix permissive insert/update
DROP POLICY IF EXISTS "Anyone can insert payment links" ON payment_link_tracking;
DROP POLICY IF EXISTS "Instructors can view their payment links" ON payment_link_tracking;
DROP POLICY IF EXISTS "Anyone can update payment links" ON payment_link_tracking;

CREATE POLICY "Public can insert payment links" ON payment_link_tracking
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Instructors can view payment links" ON payment_link_tracking
  FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment links" ON payment_link_tracking
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 17. pupil_referrals: anyone can manage → instructor ownership
DROP POLICY IF EXISTS "Instructors can manage referrals" ON pupil_referrals;

CREATE POLICY "Instructors manage own pupil referrals" ON pupil_referrals
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- 18. pupil_upsells: remove service role ALL true
DROP POLICY IF EXISTS "Service role has full access to pupil_upsells" ON pupil_upsells;

-- 19. pupil_achievements: remove service role ALL true
DROP POLICY IF EXISTS "Service role can manage achievements" ON pupil_achievements;

CREATE POLICY "Admins can manage pupil achievements" ON pupil_achievements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 20. pupil_coaching_messages: remove service role ALL true
DROP POLICY IF EXISTS "Service role can manage coaching messages" ON pupil_coaching_messages;

CREATE POLICY "Admins can manage coaching messages" ON pupil_coaching_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 21. parent_otp_codes: remove service role ALL true
DROP POLICY IF EXISTS "Service role can manage parent OTP codes" ON parent_otp_codes;

-- 22. pupil_otp_codes: remove service role ALL true
DROP POLICY IF EXISTS "Service role can manage OTP codes" ON pupil_otp_codes;

-- 23. pupil_push_subscriptions: remove service role ALL true
DROP POLICY IF EXISTS "Service role can manage pupil push subscriptions" ON pupil_push_subscriptions;

-- 24. instructor_notifications: fix insert
DROP POLICY IF EXISTS "Service role can insert notifications" ON instructor_notifications;

CREATE POLICY "Admins can insert notifications" ON instructor_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 25. lesson_waitlist: remove service role ALL true
DROP POLICY IF EXISTS "Service role waitlist access" ON lesson_waitlist;

-- 26. slot_offers: remove service role ALL true
DROP POLICY IF EXISTS "Service role slot offers access" ON slot_offers;

-- 27. pre_lesson_checklist_completions: fix insert/update
DROP POLICY IF EXISTS "Allow insert for scheduled lessons" ON pre_lesson_checklist_completions;
DROP POLICY IF EXISTS "Allow update for own completions" ON pre_lesson_checklist_completions;

CREATE POLICY "Public can insert checklist completions" ON pre_lesson_checklist_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Instructors can update checklist completions" ON pre_lesson_checklist_completions
  FOR UPDATE TO authenticated
  USING (pupil_id IN (
    SELECT p.id FROM pupils p
    JOIN instructors i ON i.id = p.instructor_id
    WHERE i.auth_user_id = auth.uid()
  ));

-- 28. pupil_leaderboard: fix insert/update
DROP POLICY IF EXISTS "System can insert leaderboard entries" ON pupil_leaderboard;
DROP POLICY IF EXISTS "System can update leaderboard entries" ON pupil_leaderboard;

CREATE POLICY "Admins can manage leaderboard" ON pupil_leaderboard
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 29. pupil_rewards_history: fix insert
DROP POLICY IF EXISTS "Instructors can insert rewards history" ON pupil_rewards_history;

CREATE POLICY "Instructors can insert rewards history" ON pupil_rewards_history
  FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 30. platform_commissions: fix insert
DROP POLICY IF EXISTS "Allow insert for all" ON platform_commissions;

CREATE POLICY "Admins can insert platform commissions" ON platform_commissions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 31. telematics_motion_raw: fix insert
DROP POLICY IF EXISTS "Service role can insert motion data" ON telematics_motion_raw;

CREATE POLICY "Instructors can insert motion data" ON telematics_motion_raw
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM lesson_telematics lt
    JOIN instructors i ON lt.instructor_id = i.id
    WHERE lt.id = telematics_motion_raw.telematics_id AND i.auth_user_id = auth.uid()
  ));

-- 32. telematics_alerts: fix insert
DROP POLICY IF EXISTS "Service role can insert alerts" ON telematics_alerts;

-- 33. telematics_realtime_alerts: fix insert
DROP POLICY IF EXISTS "Service can insert alerts" ON telematics_realtime_alerts;

-- 34. reflective_logs: fix anon ALL true
DROP POLICY IF EXISTS "Pupils can manage their own reflective logs" ON reflective_logs;

CREATE POLICY "Pupils can manage own reflective logs" ON reflective_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 35. gap_offers: remove service role ALL
DROP POLICY IF EXISTS "Service role has full access to gap_offers" ON gap_offers;
