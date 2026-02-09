
-- =============================================
-- BATCH 1: Fix admin/CMS table RLS policies
-- Replace USING(true) with admin-only checks
-- =============================================

-- 1. admin_section_notes: public CRUD → admin only
DROP POLICY IF EXISTS "Allow public delete for admin section notes" ON admin_section_notes;
DROP POLICY IF EXISTS "Allow public insert for admin section notes" ON admin_section_notes;
DROP POLICY IF EXISTS "Allow public read for admin section notes" ON admin_section_notes;
DROP POLICY IF EXISTS "Allow public update for admin section notes" ON admin_section_notes;

CREATE POLICY "Admins can manage admin section notes" ON admin_section_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read admin section notes" ON admin_section_notes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. admin_todos: any authenticated → admin only
DROP POLICY IF EXISTS "Authenticated users can delete todos" ON admin_todos;
DROP POLICY IF EXISTS "Authenticated users can insert todos" ON admin_todos;
DROP POLICY IF EXISTS "Authenticated users can view todos" ON admin_todos;
DROP POLICY IF EXISTS "Authenticated users can update todos" ON admin_todos;

CREATE POLICY "Admins can manage admin todos" ON admin_todos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. admin_websites_needed: any authenticated → admin only
DROP POLICY IF EXISTS "Authenticated users can delete websites needed" ON admin_websites_needed;
DROP POLICY IF EXISTS "Authenticated users can insert websites needed" ON admin_websites_needed;
DROP POLICY IF EXISTS "Authenticated users can view websites needed" ON admin_websites_needed;
DROP POLICY IF EXISTS "Authenticated users can update websites needed" ON admin_websites_needed;

CREATE POLICY "Admins can manage admin websites needed" ON admin_websites_needed
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. admin_activity_log: RLS enabled, no policies → admin only
CREATE POLICY "Admins can manage admin activity log" ON admin_activity_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. admin_campaigns: RLS enabled, no policies → admin only
CREATE POLICY "Admins can manage admin campaigns" ON admin_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. homepage_features: anyone can manage → admin manage, public read active
DROP POLICY IF EXISTS "Anyone can manage homepage features" ON homepage_features;

CREATE POLICY "Admins can manage homepage features" ON homepage_features
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. homepage_hero: anyone can manage → admin manage, public read active
DROP POLICY IF EXISTS "Anyone can manage homepage hero" ON homepage_hero;

CREATE POLICY "Admins can manage homepage hero" ON homepage_hero
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. homepage_sections: anyone can manage → admin manage
DROP POLICY IF EXISTS "Admins can manage homepage sections" ON homepage_sections;

CREATE POLICY "Admins manage homepage sections" ON homepage_sections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. homepage_stats: anyone can manage → admin manage
DROP POLICY IF EXISTS "Anyone can manage homepage stats" ON homepage_stats;

CREATE POLICY "Admins can manage homepage stats" ON homepage_stats
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. homepage_testimonials: anyone can manage → admin manage
DROP POLICY IF EXISTS "Anyone can manage homepage testimonials" ON homepage_testimonials;

CREATE POLICY "Admins can manage homepage testimonials" ON homepage_testimonials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. course_templates: anyone can manage → admin manage, public read
DROP POLICY IF EXISTS "Anyone can manage course templates" ON course_templates;

CREATE POLICY "Admins can manage course templates" ON course_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 12. included_features: anyone can manage → admin manage
DROP POLICY IF EXISTS "Allow all operations for included features" ON included_features;

CREATE POLICY "Admins can manage included features" ON included_features
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 13. instructor_app_features: anyone can manage → admin manage
DROP POLICY IF EXISTS "Admins can manage instructor app features" ON instructor_app_features;

CREATE POLICY "Admins manage instructor app features" ON instructor_app_features
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. instructor_app_hero: anyone can manage → admin manage
DROP POLICY IF EXISTS "Admins can manage instructor app hero" ON instructor_app_hero;

CREATE POLICY "Admins manage instructor app hero" ON instructor_app_hero
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 15. instructor_app_sections: anyone can manage → admin manage
DROP POLICY IF EXISTS "Admins can manage instructor app sections" ON instructor_app_sections;

CREATE POLICY "Admins manage instructor app sections" ON instructor_app_sections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 16. instructor_app_testimonials: anyone can manage → admin manage
DROP POLICY IF EXISTS "Admins can manage instructor app testimonials" ON instructor_app_testimonials;

CREATE POLICY "Admins manage instructor app testimonials" ON instructor_app_testimonials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 17. booking_upsells: service role full access → admin manage, public read active
DROP POLICY IF EXISTS "Service role has full access to booking_upsells" ON booking_upsells;

CREATE POLICY "Admins can manage booking upsells" ON booking_upsells
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 18. course_reviews: anyone can manage → admin manage, public read visible
DROP POLICY IF EXISTS "Anyone can manage reviews" ON course_reviews;

CREATE POLICY "Admins can manage course reviews" ON course_reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 19. course_enquiries: remove the overly broad "Anyone can manage pupils" policy
DROP POLICY IF EXISTS "Anyone can manage pupils" ON course_enquiries;

-- 20. site_images: anyone can manage → admin manage
DROP POLICY IF EXISTS "Anyone can manage site images" ON site_images;

CREATE POLICY "Admins can manage site images" ON site_images
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 21. site_settings: anyone can manage → admin manage
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;

CREATE POLICY "Admins manage site settings" ON site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 22. test_centres: anyone can manage → admin manage
DROP POLICY IF EXISTS "Anyone can manage test centres" ON test_centres;

CREATE POLICY "Admins can manage test centres" ON test_centres
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 23. instructor_test_centres: anyone can manage → admin + instructor manage
DROP POLICY IF EXISTS "Anyone can manage instructor test centres" ON instructor_test_centres;

CREATE POLICY "Admins can manage instructor test centres" ON instructor_test_centres
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 24. instructor_courses: anyone can manage → admin manage
DROP POLICY IF EXISTS "Anyone can manage instructor courses" ON instructor_courses;

CREATE POLICY "Admins can manage instructor courses" ON instructor_courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 25. instructor_homepage_content: public insert/update → admin manage
DROP POLICY IF EXISTS "Allow public insert to instructor homepage content" ON instructor_homepage_content;
DROP POLICY IF EXISTS "Allow public read access to instructor homepage content" ON instructor_homepage_content;
DROP POLICY IF EXISTS "Allow public update to instructor homepage content" ON instructor_homepage_content;

CREATE POLICY "Admins can manage instructor homepage content" ON instructor_homepage_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read instructor homepage content" ON instructor_homepage_content
  FOR SELECT USING (true);
