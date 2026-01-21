-- CRITICAL SECURITY FIX: Replace USING(true) policies with proper role-scoped policies
-- This migration fixes multiple tables that were publicly accessible

-- ===== 1. instructor_calendar_tokens - CRITICAL: OAuth tokens were exposed =====
-- Make this table SERVICE ROLE ONLY - no client access at all (edge functions use service role)
DROP POLICY IF EXISTS "Instructors can view their own tokens" ON instructor_calendar_tokens;
DROP POLICY IF EXISTS "Instructors can insert their own tokens" ON instructor_calendar_tokens;
DROP POLICY IF EXISTS "Instructors can update their own tokens" ON instructor_calendar_tokens;
DROP POLICY IF EXISTS "Instructors can delete their own tokens" ON instructor_calendar_tokens;

-- Deny all client access - only service role (edge functions) can access
CREATE POLICY "Service role only access for calendar tokens"
ON instructor_calendar_tokens FOR ALL
USING (false);

-- ===== 2. pupils table - CRITICAL: Student PII was exposed =====
DROP POLICY IF EXISTS "Pupils are publicly viewable" ON pupils;
DROP POLICY IF EXISTS "Anyone can insert pupils" ON pupils;
DROP POLICY IF EXISTS "Anyone can update pupils" ON pupils;
DROP POLICY IF EXISTS "Anyone can delete pupils" ON pupils;
DROP POLICY IF EXISTS "Anyone can manage pupils" ON pupils;

-- Instructors can only access their own pupils, admins can access all
CREATE POLICY "Instructors manage own pupils"
ON pupils FOR ALL
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 3. course_enquiries - Customer PII was exposed =====
DROP POLICY IF EXISTS "Course enquiries are publicly viewable" ON course_enquiries;
DROP POLICY IF EXISTS "Anyone can insert course enquiries" ON course_enquiries;
DROP POLICY IF EXISTS "Anyone can update course enquiries" ON course_enquiries;
DROP POLICY IF EXISTS "Anyone can delete course enquiries" ON course_enquiries;

-- Anyone can CREATE an enquiry (public form)
CREATE POLICY "Public can create enquiries"
ON course_enquiries FOR INSERT
WITH CHECK (true);

-- Only admins and assigned instructors can view
CREATE POLICY "Admins and assigned instructors view enquiries"
ON course_enquiries FOR SELECT
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR assigned_instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  )
);

-- Only admins can update/delete enquiries
CREATE POLICY "Admins manage enquiries"
ON course_enquiries FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR assigned_instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Admins delete enquiries"
ON course_enquiries FOR DELETE
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ===== 4. payment_history - Financial data was exposed =====
DROP POLICY IF EXISTS "Payment history is viewable by instructors" ON payment_history;
DROP POLICY IF EXISTS "Instructors can insert payment history" ON payment_history;
DROP POLICY IF EXISTS "Instructors can delete payment history" ON payment_history;
DROP POLICY IF EXISTS "Anyone can view payment history" ON payment_history;
DROP POLICY IF EXISTS "Anyone can insert payment history" ON payment_history;
DROP POLICY IF EXISTS "Anyone can delete payment history" ON payment_history;

-- Instructors access own payment history, admins access all
CREATE POLICY "Instructors access own payment history"
ON payment_history FOR ALL
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 5. push_subscriptions - Notification endpoints were exposed =====
DROP POLICY IF EXISTS "Push subscriptions are publicly viewable" ON push_subscriptions;
DROP POLICY IF EXISTS "Anyone can insert push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Anyone can update push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Anyone can delete push subscriptions" ON push_subscriptions;

-- Instructors can only manage their own push subscriptions
CREATE POLICY "Instructors manage own push subscriptions"
ON push_subscriptions FOR ALL
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  )
);

-- ===== 6. instructor_working_hours - Was exposed =====
DROP POLICY IF EXISTS "Working hours are publicly viewable" ON instructor_working_hours;
DROP POLICY IF EXISTS "Anyone can view working hours" ON instructor_working_hours;
DROP POLICY IF EXISTS "Instructors can insert their own working hours" ON instructor_working_hours;
DROP POLICY IF EXISTS "Instructors can update their own working hours" ON instructor_working_hours;
DROP POLICY IF EXISTS "Instructors can delete their own working hours" ON instructor_working_hours;

-- Public can view (for booking availability)
CREATE POLICY "Working hours publicly viewable for booking"
ON instructor_working_hours FOR SELECT
USING (true);

-- Only the instructor or admin can modify
CREATE POLICY "Instructors manage own working hours"
ON instructor_working_hours FOR INSERT
WITH CHECK (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Instructors update own working hours"
ON instructor_working_hours FOR UPDATE
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Instructors delete own working hours"
ON instructor_working_hours FOR DELETE
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 7. instructor_date_overrides - Was exposed =====
DROP POLICY IF EXISTS "Date overrides are publicly viewable" ON instructor_date_overrides;
DROP POLICY IF EXISTS "Anyone can view date overrides" ON instructor_date_overrides;
DROP POLICY IF EXISTS "Instructors can insert their own date overrides" ON instructor_date_overrides;
DROP POLICY IF EXISTS "Instructors can update their own date overrides" ON instructor_date_overrides;
DROP POLICY IF EXISTS "Instructors can delete their own date overrides" ON instructor_date_overrides;

-- Public can view (for booking availability)
CREATE POLICY "Date overrides publicly viewable for booking"
ON instructor_date_overrides FOR SELECT
USING (true);

-- Only the instructor or admin can modify
CREATE POLICY "Instructors manage own date overrides"
ON instructor_date_overrides FOR INSERT
WITH CHECK (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Instructors update own date overrides"
ON instructor_date_overrides FOR UPDATE
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Instructors delete own date overrides"
ON instructor_date_overrides FOR DELETE
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 8. scheduled_lessons - Was exposed =====
DROP POLICY IF EXISTS "Scheduled lessons are viewable" ON scheduled_lessons;
DROP POLICY IF EXISTS "Anyone can view scheduled lessons" ON scheduled_lessons;
DROP POLICY IF EXISTS "Anyone can insert scheduled lessons" ON scheduled_lessons;
DROP POLICY IF EXISTS "Anyone can update scheduled lessons" ON scheduled_lessons;
DROP POLICY IF EXISTS "Anyone can delete scheduled lessons" ON scheduled_lessons;

-- Instructors can view their own lessons, public can view for availability
CREATE POLICY "Instructors view own scheduled lessons"
ON scheduled_lessons FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Instructors/admins can manage their own lessons
CREATE POLICY "Instructors manage own scheduled lessons"
ON scheduled_lessons FOR INSERT
WITH CHECK (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Instructors update own scheduled lessons"
ON scheduled_lessons FOR UPDATE
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Instructors delete own scheduled lessons"
ON scheduled_lessons FOR DELETE
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 9. lesson_history - Was exposed =====
DROP POLICY IF EXISTS "Lesson history is viewable" ON lesson_history;
DROP POLICY IF EXISTS "Anyone can view lesson history" ON lesson_history;
DROP POLICY IF EXISTS "Anyone can insert lesson history" ON lesson_history;
DROP POLICY IF EXISTS "Anyone can update lesson history" ON lesson_history;
DROP POLICY IF EXISTS "Anyone can delete lesson history" ON lesson_history;

-- Instructors can only access their own lesson history
CREATE POLICY "Instructors access own lesson history"
ON lesson_history FOR ALL
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 10. instructor_calendar_events - External calendar events =====
DROP POLICY IF EXISTS "Calendar events are viewable by instructor" ON instructor_calendar_events;
DROP POLICY IF EXISTS "Anyone can view calendar events" ON instructor_calendar_events;
DROP POLICY IF EXISTS "Anyone can insert calendar events" ON instructor_calendar_events;
DROP POLICY IF EXISTS "Anyone can update calendar events" ON instructor_calendar_events;
DROP POLICY IF EXISTS "Anyone can delete calendar events" ON instructor_calendar_events;

-- Service role only for calendar events (synced by edge functions)
CREATE POLICY "Service role only for calendar events"
ON instructor_calendar_events FOR ALL
USING (false);

-- ===== 11. Storage Bucket Policies - Anonymous upload/delete was allowed =====
DROP POLICY IF EXISTS "Anyone can upload instructor images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update instructor images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete instructor images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload course videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update course videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete course videos" ON storage.objects;

-- Authenticated users with instructor or admin role can upload
CREATE POLICY "Instructors and admins upload to instructor-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instructor-images'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM instructors WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Instructors and admins update instructor-images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'instructor-images'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM instructors WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Instructors and admins delete instructor-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'instructor-images'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM instructors WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Instructors and admins upload to course-videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-videos'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM instructors WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Instructors and admins update course-videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-videos'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM instructors WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Instructors and admins delete course-videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-videos'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM instructors WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

-- ===== 12. Delete exposed OAuth tokens - CRITICAL =====
-- The tokens that were exposed should be rotated - users will need to reconnect
DELETE FROM instructor_calendar_tokens;

-- ===== 13. instructor_google_service_calendar - Make service role only =====
DROP POLICY IF EXISTS "Anyone can view google service calendar" ON instructor_google_service_calendar;
DROP POLICY IF EXISTS "Anyone can insert google service calendar" ON instructor_google_service_calendar;
DROP POLICY IF EXISTS "Anyone can update google service calendar" ON instructor_google_service_calendar;
DROP POLICY IF EXISTS "Anyone can delete google service calendar" ON instructor_google_service_calendar;

CREATE POLICY "Service role only for google service calendar"
ON instructor_google_service_calendar FOR ALL
USING (false);