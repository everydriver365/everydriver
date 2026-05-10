INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-documents', 'compliance-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Instructors view own compliance docs" ON storage.objects;
CREATE POLICY "Instructors view own compliance docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = public.get_instructor_id_for_user(auth.uid())::text
);

DROP POLICY IF EXISTS "Instructors upload own compliance docs" ON storage.objects;
CREATE POLICY "Instructors upload own compliance docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = public.get_instructor_id_for_user(auth.uid())::text
);

DROP POLICY IF EXISTS "Instructors update own compliance docs" ON storage.objects;
CREATE POLICY "Instructors update own compliance docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = public.get_instructor_id_for_user(auth.uid())::text
);

DROP POLICY IF EXISTS "Instructors delete own compliance docs" ON storage.objects;
CREATE POLICY "Instructors delete own compliance docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = public.get_instructor_id_for_user(auth.uid())::text
);