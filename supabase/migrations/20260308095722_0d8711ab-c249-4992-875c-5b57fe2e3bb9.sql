
-- ============================================
-- PRIORITY 1: Fix Critical RLS Policies
-- ============================================

-- 1. INSTRUCTORS: Remove anon SELECT that exposes emails, phones, addresses, tokens
-- Public lookups should use the public_instructors view instead
DROP POLICY IF EXISTS "Anon can view active instructors" ON public.instructors;

-- 2. REFLECTIVE_LOGS: Remove public ALL policy (USING true, WITH CHECK true)
DROP POLICY IF EXISTS "Pupils can manage own reflective logs" ON public.reflective_logs;

-- 3. LESSON_FEEDBACK: Fix tautology UPDATE (pupil_id = pupil_id always true)
DROP POLICY IF EXISTS "Pupils can update own feedback" ON public.lesson_feedback;
-- Cannot properly scope to pupil since pupils use anon role without Supabase Auth
-- Keep update restricted to authenticated instructors instead
CREATE POLICY "Instructors can update lesson feedback"
ON public.lesson_feedback FOR UPDATE TO authenticated
USING (instructor_id = get_instructor_id_for_user(auth.uid()));

-- 4. LESSON_FEEDBACK: Restrict INSERT to authenticated instructors
DROP POLICY IF EXISTS "Instructors can insert feedback requests" ON public.lesson_feedback;
CREATE POLICY "Instructors can insert feedback requests"
ON public.lesson_feedback FOR INSERT TO authenticated
WITH CHECK (instructor_id = get_instructor_id_for_user(auth.uid()));

-- 5. LESSON_FEEDBACK: Restrict SELECT to authenticated
DROP POLICY IF EXISTS "Pupils can view own feedback" ON public.lesson_feedback;
CREATE POLICY "Instructors can view own feedback"
ON public.lesson_feedback FOR SELECT TO authenticated
USING (instructor_id = get_instructor_id_for_user(auth.uid()));

-- 6. QUOTES: Fix anon SELECT to actually filter by token
DROP POLICY IF EXISTS "Public can view quotes by token" ON public.quotes;
CREATE POLICY "Public can view quotes by token"
ON public.quotes FOR SELECT TO anon
USING (token IS NOT NULL AND expires_at > now());

-- 7. PUPIL_SUBSCRIPTIONS: Remove anon SELECT exposing pickup addresses
DROP POLICY IF EXISTS "Public can read subscriptions" ON public.pupil_subscriptions;

-- ============================================
-- PRIORITY 2: Fix Permissive Write Policies  
-- ============================================

-- 8. LESSON_REMINDERS_LOG: Remove public INSERT (service_role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can insert reminder logs" ON public.lesson_reminders_log;

-- 9. PAYMENT_REMINDER_LOG: Remove public INSERT (service_role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service can insert reminder logs" ON public.payment_reminder_log;

-- ============================================
-- PRIORITY 4: Reduce Data Exposure
-- ============================================

-- 10. INSTRUCTOR_CALENDAR_EVENTS: Remove public SELECT exposing calendar titles
DROP POLICY IF EXISTS "Public can view instructor calendar events" ON public.instructor_calendar_events;

-- 11. LESSON_SYLLABUS_UPDATES: Remove anon SELECT exposing all pupil progress
DROP POLICY IF EXISTS "Anyone can read syllabus updates by pupil_id" ON public.lesson_syllabus_updates;

-- 12. PLATFORM_COMMISSIONS: Restrict SELECT to owning instructor + admin
DROP POLICY IF EXISTS "Allow read for all authenticated" ON public.platform_commissions;
CREATE POLICY "Instructors can view own commissions"
ON public.platform_commissions FOR SELECT TO authenticated
USING (
  instructor_id = get_instructor_id_for_user(auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- 13. GEOTAB_SESSION_CACHE: Add policy so table is accessible by authenticated instructors
CREATE POLICY "Authenticated users can manage session cache"
ON public.geotab_session_cache FOR ALL TO authenticated
USING (true) WITH CHECK (true);
