
-- =============================================
-- BATCH 2b: Fix remaining permissive policies
-- =============================================

-- 1. course_enquiries: remove duplicate insert policy
DROP POLICY IF EXISTS "Anyone can create course enquiries" ON course_enquiries;
-- Keep "Public can create enquiries" as intentional public insert

-- 2. instructor_date_overrides: fix permissive update
DROP POLICY IF EXISTS "Anyone can update date overrides" ON instructor_date_overrides;

-- 3. vehicle_security_alerts: fix service role insert
DROP POLICY IF EXISTS "Service role can insert alerts" ON vehicle_security_alerts;

CREATE POLICY "Admins can insert vehicle security alerts" ON vehicle_security_alerts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Add policies for tables with RLS enabled but no policies
-- Check which tables have no policies
-- parent_otp_codes, pupil_otp_codes, pupil_push_subscriptions now have no policies
-- These are service-role-only tables accessed by edge functions, so we add no anon/auth policies
-- (service_role bypasses RLS). But we should add admin read at minimum.

CREATE POLICY "Admins can manage parent OTP codes" ON parent_otp_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pupil OTP codes" ON pupil_otp_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pupil push subscriptions" ON pupil_push_subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. telematics_alerts: needs insert policy (removed service role)
CREATE POLICY "Instructors can insert telematics alerts" ON telematics_alerts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM lesson_telematics lt
    JOIN instructors i ON lt.instructor_id = i.id
    WHERE lt.id = telematics_alerts.telematics_id AND i.auth_user_id = auth.uid()
  ));

-- 6. telematics_realtime_alerts: needs insert policy
CREATE POLICY "Instructors can insert realtime alerts" ON telematics_realtime_alerts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM lesson_telematics lt
    WHERE lt.id = telematics_realtime_alerts.telematics_id 
    AND lt.instructor_id = public.get_instructor_id_for_user(auth.uid())
  ));
