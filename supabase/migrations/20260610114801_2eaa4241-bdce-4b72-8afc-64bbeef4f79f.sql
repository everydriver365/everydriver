
-- Fix 1: reschedule_requests
DROP POLICY IF EXISTS "Pupils can view own reschedule requests" ON public.reschedule_requests;

CREATE POLICY "Pupils view own reschedule requests"
ON public.reschedule_requests FOR SELECT TO authenticated
USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors view own reschedule requests"
ON public.reschedule_requests FOR SELECT TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Fix 2: course_enquiries (uses assigned_instructor_id)
DROP POLICY IF EXISTS "Instructors can view pending unassigned enquiries" ON public.course_enquiries;

CREATE POLICY "Admins view all course enquiries"
ON public.course_enquiries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors view own assigned enquiries"
ON public.course_enquiries FOR SELECT TO authenticated
USING (assigned_instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Fix 3: pupil-avatars storage
DROP POLICY IF EXISTS "Anyone can upload pupil avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update pupil avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete pupil avatars" ON storage.objects;

CREATE POLICY "Pupils manage own avatars"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'pupil-avatars'
  AND split_part(name, '/', 1)::uuid IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  bucket_id = 'pupil-avatars'
  AND split_part(name, '/', 1)::uuid IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
);

-- Fix 4: hero-images storage
DROP POLICY IF EXISTS "Authenticated users can upload hero images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update hero images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete hero images" ON storage.objects;

CREATE POLICY "Instructors manage own hero images"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'hero-images'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
)
WITH CHECK (
  bucket_id = 'hero-images'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);

-- Fix 5: instructor_website_settings remove anon read
DROP POLICY IF EXISTS "Anyone can view instructor website settings" ON public.instructor_website_settings;

CREATE POLICY "Instructors view own website settings"
ON public.instructor_website_settings FOR SELECT TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));
