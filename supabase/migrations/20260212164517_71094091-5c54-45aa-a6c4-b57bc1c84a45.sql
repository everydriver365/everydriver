
-- =====================================================
-- MIGRATION 2: Fix reflective_logs and add missing policies
-- =====================================================

-- 1. REFLECTIVE_LOGS - Drop dangerous ALL policy, replace with ownership checks
DROP POLICY IF EXISTS "Allow all access to reflective logs" ON public.reflective_logs;

-- Instructors can view reflective logs for their pupils
CREATE POLICY "Instructors can view reflective logs"
  ON public.reflective_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pupils p
      WHERE p.id = reflective_logs.pupil_id
        AND p.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- Instructors can insert reflective logs for their pupils
CREATE POLICY "Instructors can insert reflective logs"
  ON public.reflective_logs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pupils p
      WHERE p.id = reflective_logs.pupil_id
        AND p.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- Instructors can update reflective logs for their pupils
CREATE POLICY "Instructors can update reflective logs"
  ON public.reflective_logs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pupils p
      WHERE p.id = reflective_logs.pupil_id
        AND p.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- Instructors can delete reflective logs for their pupils
CREATE POLICY "Instructors can delete reflective logs"
  ON public.reflective_logs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pupils p
      WHERE p.id = reflective_logs.pupil_id
        AND p.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- 2. CRON_SYNC_CONFIG - Add admin-only policy
CREATE POLICY "Only admins can access cron sync config"
  ON public.cron_sync_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. QUARTIX_AUTH_CACHE - Add admin-only policy
CREATE POLICY "Only admins can access quartix auth cache"
  ON public.quartix_auth_cache FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
