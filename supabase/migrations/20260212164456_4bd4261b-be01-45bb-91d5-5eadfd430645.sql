
-- =====================================================
-- MIGRATION 1: Fix dangerous USING(true) SELECT policies
-- =====================================================

-- 1. PUPILS
DROP POLICY IF EXISTS "Parents can view pupils by parent phone" ON public.pupils;
CREATE POLICY "Instructors can view their own pupils"
  ON public.pupils FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 2. LESSON_HISTORY
DROP POLICY IF EXISTS "Lesson history is publicly viewable" ON public.lesson_history;
DROP POLICY IF EXISTS "Parents can view lesson history for their children" ON public.lesson_history;
CREATE POLICY "Instructors can view their own lesson history"
  ON public.lesson_history FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 3. PAYMENT_HISTORY
DROP POLICY IF EXISTS "Parents can view payment history for their children" ON public.payment_history;
CREATE POLICY "Instructors can view their own payment history"
  ON public.payment_history FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 4. SCHEDULED_LESSONS
DROP POLICY IF EXISTS "Scheduled lessons are publicly viewable" ON public.scheduled_lessons;
DROP POLICY IF EXISTS "Parents can view scheduled lessons for their children" ON public.scheduled_lessons;
CREATE POLICY "Instructors can view their own scheduled lessons"
  ON public.scheduled_lessons FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));
-- Keep anon access for booking availability
CREATE POLICY "Public can view lesson times for booking"
  ON public.scheduled_lessons FOR SELECT TO anon
  USING (true);

-- 5. PUPIL_ACHIEVEMENTS (no instructor_id, join through pupils)
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.pupil_achievements;
CREATE POLICY "Instructors can view their pupils achievements"
  ON public.pupil_achievements FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pupils p
      WHERE p.id = pupil_achievements.pupil_id
        AND p.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- 6. PUPIL_BADGES (no instructor_id, join through pupils)
DROP POLICY IF EXISTS "Pupil badges are viewable by everyone" ON public.pupil_badges;
CREATE POLICY "Instructors can view their pupils badges"
  ON public.pupil_badges FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pupils p
      WHERE p.id = pupil_badges.pupil_id
        AND p.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- 7. PUPIL_COACHING_MESSAGES (no instructor_id, join through pupils)
DROP POLICY IF EXISTS "Anyone can view coaching messages" ON public.pupil_coaching_messages;
CREATE POLICY "Instructors can view their pupils coaching messages"
  ON public.pupil_coaching_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pupils p
      WHERE p.id = pupil_coaching_messages.pupil_id
        AND p.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- 8. PUPIL_REFERRALS (has instructor_id)
DROP POLICY IF EXISTS "Public read access for referrals" ON public.pupil_referrals;
CREATE POLICY "Instructors can view their pupils referrals"
  ON public.pupil_referrals FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 9. PUPIL_REWARDS_HISTORY (has instructor_id)
DROP POLICY IF EXISTS "Public read access for rewards history" ON public.pupil_rewards_history;
CREATE POLICY "Instructors can view their pupils rewards history"
  ON public.pupil_rewards_history FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 10. PUPIL_SYLLABUS_PROGRESS (no instructor_id, join through pupils)
DROP POLICY IF EXISTS "Pupils can view their own syllabus progress" ON public.pupil_syllabus_progress;
CREATE POLICY "Instructors can view their pupils syllabus progress"
  ON public.pupil_syllabus_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pupils p
      WHERE p.id = pupil_syllabus_progress.pupil_id
        AND p.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- 11. LESSON_SYLLABUS_UPDATES (has lesson_history_id, join through lesson_history)
DROP POLICY IF EXISTS "Anyone can read syllabus updates" ON public.lesson_syllabus_updates;
CREATE POLICY "Instructors can view their lesson syllabus updates"
  ON public.lesson_syllabus_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lesson_history lh
      WHERE lh.id = lesson_syllabus_updates.lesson_history_id
        AND lh.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- 12. LESSON_CANCELLATION_REQUESTS (has instructor_id)
DROP POLICY IF EXISTS "Public can view cancellation requests" ON public.lesson_cancellation_requests;
CREATE POLICY "Instructors can view their cancellation requests"
  ON public.lesson_cancellation_requests FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));
